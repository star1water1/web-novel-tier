package expo.modules.fileaccessnative

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.DocumentsContract
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.BufferedReader
import java.io.FileNotFoundException
import java.io.InputStream
import java.io.OutputStream
import java.io.OutputStreamWriter
import java.nio.charset.StandardCharsets
import java.security.DigestInputStream
import java.security.DigestOutputStream
import java.security.MessageDigest
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

internal class InvalidDocumentUriException(uri: String) :
  CodedException("ERR_FILE_ACCESS_INVALID_URI", "Not a document URI: $uri", null)

internal class PermissionLostException(uri: String, cause: Throwable) :
  CodedException("ERR_FILE_ACCESS_PERMISSION_LOST", "No access to: $uri", cause)

internal class DocumentNotFoundException(uri: String, cause: Throwable) :
  CodedException("ERR_FILE_ACCESS_NOT_FOUND", "Document not found: $uri", cause)

internal class RenameFailedException(uri: String, cause: Throwable) :
  CodedException("ERR_FILE_ACCESS_RENAME_FAILED", "Could not rename: $uri", cause)

internal class StreamClosedException(id: Int) :
  CodedException("ERR_FILE_ACCESS_STREAM_CLOSED", "Stream is not open: $id", null)

private fun ByteArray.toHex() = joinToString("") { "%02x".format(it) }

private class TextWriterSession(output: OutputStream) {
  val digest: MessageDigest = MessageDigest.getInstance("SHA-256")
  private val counting = CountingOutputStream(DigestOutputStream(output.buffered(), digest))
  val writer = OutputStreamWriter(counting, StandardCharsets.UTF_8)
  val bytes get() = counting.count
}

private class CountingOutputStream(private val out: OutputStream) : OutputStream() {
  var count = 0L
    private set

  override fun write(b: Int) {
    out.write(b)
    count++
  }

  override fun write(b: ByteArray, off: Int, len: Int) {
    out.write(b, off, len)
    count += len
  }

  override fun flush() = out.flush()

  override fun close() = out.close()
}

/**
 * expo-file-system(SDK 54)이 제공하지 않는 SAF 기능만 담는다.
 * - 유지 중인 URI 권한 조회·해제: Expo는 권한을 얻기만 하고 조회·해제 API가 없다.
 * - SAF 문서 이름 변경: Expo의 rename은 java.io.File 기반이라 content URI에서 예외가 난다.
 * - 큰 텍스트 조각 쓰기·읽기와 해시: Expo의 text()·write()는 파일 전체를 Java 힙에 올려
 *   수십 MB부터 OutOfMemoryError가 난다.
 */
class FileAccessNativeModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val nextStreamId = AtomicInteger(1)
  private val writers = ConcurrentHashMap<Int, TextWriterSession>()
  private val readers = ConcurrentHashMap<Int, BufferedReader>()

  private inline fun <T> mapIoErrors(uri: String, block: () -> T): T =
    try {
      block()
    } catch (e: SecurityException) {
      throw PermissionLostException(uri, e)
    } catch (e: FileNotFoundException) {
      throw DocumentNotFoundException(uri, e)
    }

  private fun openInput(uriString: String): InputStream =
    context.contentResolver.openInputStream(Uri.parse(uriString))
      ?: throw FileNotFoundException(uriString)

  private fun closeAllStreams() {
    writers.values.forEach { runCatching { it.writer.close() } }
    writers.clear()
    readers.values.forEach { runCatching { it.close() } }
    readers.clear()
  }

  override fun definition() = ModuleDefinition {
    Name("FileAccessNative")

    AsyncFunction("listPersistedUris") {
      context.contentResolver.persistedUriPermissions.map {
        mapOf(
          "uri" to it.uri.toString(),
          "read" to it.isReadPermission,
          "write" to it.isWritePermission,
          "persistedTime" to it.persistedTime
        )
      }
    }

    AsyncFunction("releasePersistedUri") { uriString: String ->
      val uri = Uri.parse(uriString)
      val resolver = context.contentResolver
      val grant = resolver.persistedUriPermissions.firstOrNull { it.uri == uri }
        ?: return@AsyncFunction false

      var flags = 0
      if (grant.isReadPermission) flags = flags or Intent.FLAG_GRANT_READ_URI_PERMISSION
      if (grant.isWritePermission) flags = flags or Intent.FLAG_GRANT_WRITE_URI_PERMISSION
      resolver.releasePersistableUriPermission(uri, flags)
      true
    }

    AsyncFunction("renameDocument") { uriString: String, displayName: String ->
      val uri = Uri.parse(uriString)
      if (!DocumentsContract.isDocumentUri(context, uri)) {
        throw InvalidDocumentUriException(uriString)
      }
      val renamed = try {
        DocumentsContract.renameDocument(context.contentResolver, uri, displayName)
      } catch (e: SecurityException) {
        throw PermissionLostException(uriString, e)
      } catch (e: FileNotFoundException) {
        throw DocumentNotFoundException(uriString, e)
      } catch (e: Exception) {
        throw RenameFailedException(uriString, e)
      }
      // 문서 ID가 그대로면 provider는 새 URI를 돌려주지 않는다(null). 실패는 위에서 예외로 온다.
      (renamed ?: uri).toString()
    }

    AsyncFunction("openTextWriter") { uriString: String ->
      mapIoErrors(uriString) {
        // "wt": 기존 내용을 지우고 쓴다. 기본값 "w"는 제공자에 따라 뒷부분이 남을 수 있다.
        val output = context.contentResolver.openOutputStream(Uri.parse(uriString), "wt")
          ?: throw FileNotFoundException(uriString)
        val id = nextStreamId.getAndIncrement()
        writers[id] = TextWriterSession(output)
        id
      }
    }

    AsyncFunction("writeTextChunk") { id: Int, text: String ->
      val session = writers[id] ?: throw StreamClosedException(id)
      session.writer.write(text)
    }

    AsyncFunction("closeTextWriter") { id: Int ->
      val session = writers.remove(id) ?: throw StreamClosedException(id)
      session.writer.close()
      mapOf("bytes" to session.bytes.toDouble(), "sha256" to session.digest.digest().toHex())
    }

    AsyncFunction("abortTextWriter") { id: Int ->
      writers.remove(id)?.let { runCatching { it.writer.close() } }
      Unit
    }

    AsyncFunction("hashFile") { uriString: String ->
      mapIoErrors(uriString) {
        val digest = MessageDigest.getInstance("SHA-256")
        var bytes = 0L
        DigestInputStream(openInput(uriString), digest).use { input ->
          val buffer = ByteArray(64 * 1024)
          while (true) {
            val read = input.read(buffer)
            if (read < 0) break
            bytes += read
          }
        }
        mapOf("bytes" to bytes.toDouble(), "sha256" to digest.digest().toHex())
      }
    }

    AsyncFunction("openTextReader") { uriString: String ->
      mapIoErrors(uriString) {
        val id = nextStreamId.getAndIncrement()
        readers[id] = openInput(uriString).bufferedReader(StandardCharsets.UTF_8)
        id
      }
    }

    // 파일 끝이면 null. 이모지가 조각 경계에서 갈라지지 않도록 서로게이트 쌍을 함께 돌려준다.
    AsyncFunction("readTextChunk") { id: Int, maxChars: Int ->
      val reader = readers[id] ?: throw StreamClosedException(id)
      val buffer = CharArray(maxChars + 1)
      val read = reader.read(buffer, 0, maxChars)
      if (read < 0) {
        null
      } else {
        var length = read
        if (Character.isHighSurrogate(buffer[length - 1])) {
          val next = reader.read()
          if (next >= 0) buffer[length++] = next.toChar()
        }
        String(buffer, 0, length)
      }
    }

    AsyncFunction("closeTextReader") { id: Int ->
      readers.remove(id)?.let { runCatching { it.close() } }
      Unit
    }

    OnDestroy {
      closeAllStreams()
    }
  }
}
