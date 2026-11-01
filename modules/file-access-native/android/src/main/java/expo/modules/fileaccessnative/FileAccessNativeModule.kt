package expo.modules.fileaccessnative

import android.content.ClipData
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.DocumentsContract
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.BufferedReader
import java.io.File
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
import java.util.zip.Deflater
import java.util.zip.ZipEntry
import java.util.zip.ZipException
import java.util.zip.ZipInputStream
import java.util.zip.ZipOutputStream

// 사진 백업에 담는 폴더. 같은 앱 폴더의 키·인증 파일(ai_config.json, cloud_auth.json)과 DB가
// 섞이지 않도록 폴더를 호출자에게 맡기지 않고 여기서 고정한다.
private val MEDIA_DIRS = listOf("covers", "gallery")
private const val MEDIA_MANIFEST_ENTRY = "novel-tier-media.json"
private const val MEDIA_MANIFEST = """{"type":"novel-tier-media","format":1}"""

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

internal class NotMediaBackupException(uri: String, cause: Throwable? = null) :
  CodedException("ERR_FILE_ACCESS_NOT_MEDIA_BACKUP", "Not a valid photo backup: $uri", cause)

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
 * - 사진 ZIP 백업·복원: Expo에 압축 API가 없고, 수백 MB를 메모리에 올릴 수 없다.
 * - SAF 문서 바로 공유: expo-sharing은 file://만 받아 임시 복사본이 필요하다.
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

  /** 첫 항목이 매니페스트인 ZIP만 받는다. 깨진 파일은 ZipException으로 온다. */
  private inline fun <T> readMediaZip(uriString: String, block: (ZipInputStream) -> T): T =
    mapIoErrors(uriString) {
      try {
        ZipInputStream(openInput(uriString).buffered()).use { zip ->
          if (zip.nextEntry?.name != MEDIA_MANIFEST_ENTRY) throw NotMediaBackupException(uriString)
          block(zip)
        }
      } catch (e: ZipException) {
        throw NotMediaBackupException(uriString, e)
      }
    }

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

    AsyncFunction("exportMediaZip") { outputUri: String ->
      mapIoErrors(outputUri) {
        val output = context.contentResolver.openOutputStream(Uri.parse(outputUri), "wt")
          ?: throw FileNotFoundException(outputUri)
        val root = context.filesDir
        val digest = MessageDigest.getInstance("SHA-256")
        val counting = CountingOutputStream(DigestOutputStream(output.buffered(), digest))
        var files = 0
        var sourceBytes = 0L
        ZipOutputStream(counting).use { zip ->
          // JPEG는 이미 압축돼 있어 다시 압축해도 작아지지 않고 느리기만 하다.
          zip.setLevel(Deflater.NO_COMPRESSION)
          zip.putNextEntry(ZipEntry(MEDIA_MANIFEST_ENTRY))
          zip.write(MEDIA_MANIFEST.toByteArray())
          zip.closeEntry()
          for (dir in MEDIA_DIRS) {
            File(root, dir).walkTopDown().filter { it.isFile }.forEach { file ->
              zip.putNextEntry(ZipEntry(file.relativeTo(root).invariantSeparatorsPath))
              sourceBytes += file.inputStream().use { it.copyTo(zip) }
              zip.closeEntry()
              files++
            }
          }
        }
        mapOf(
          "files" to files,
          "sourceBytes" to sourceBytes.toDouble(),
          "bytes" to counting.count.toDouble(),
          "sha256" to digest.digest().toHex()
        )
      }
    }

    // 전체를 읽어 항목별 CRC를 검사한다. 어긋나면 ZipInputStream이 ZipException을 던진다.
    AsyncFunction("inspectMediaZip") { uriString: String ->
      readMediaZip(uriString) { zip ->
        var files = 0
        var bytes = 0L
        val sink = ByteArray(64 * 1024)
        while (true) {
          val entry = zip.nextEntry ?: break
          while (true) {
            val read = zip.read(sink)
            if (read < 0) break
            bytes += read
          }
          if (!entry.isDirectory) files++
        }
        mapOf("files" to files, "bytes" to bytes.toDouble())
      }
    }

    // 이미 있는 파일은 덮어쓰지 않는다. 허용 폴더 밖을 가리키는 항목은 파일 전체를 거부한다.
    AsyncFunction("importMediaZip") { uriString: String ->
      val root = context.filesDir.canonicalFile
      readMediaZip(uriString) { zip ->
        var restored = 0
        var skipped = 0
        var bytes = 0L
        while (true) {
          val entry = zip.nextEntry ?: break
          if (entry.isDirectory) continue
          val top = entry.name.substringBefore('/')
          val allowedRoot = File(root, top).canonicalFile
          val target = File(root, entry.name).canonicalFile
          if (top !in MEDIA_DIRS || !target.path.startsWith(allowedRoot.path + File.separator)) {
            throw NotMediaBackupException(uriString)
          }
          if (target.exists()) {
            skipped++
            continue
          }
          target.parentFile?.mkdirs()
          // 중간에 끊겨도 잘린 사진이 정상 파일처럼 남지 않도록 다 쓴 뒤 이름을 바꾼다.
          val partial = File(target.path + ".part")
          bytes += partial.outputStream().use { zip.copyTo(it) }
          if (!partial.renameTo(target)) {
            partial.delete()
            throw FileNotFoundException(target.path)
          }
          restored++
        }
        mapOf("restored" to restored, "skipped" to skipped, "bytes" to bytes.toDouble())
      }
    }

    AsyncFunction("shareDocument") { uriString: String, mimeType: String, title: String ->
      val uri = Uri.parse(uriString)
      val send = Intent(Intent.ACTION_SEND).apply {
        type = mimeType
        putExtra(Intent.EXTRA_STREAM, uri)
        clipData = ClipData.newRawUri(title, uri)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }
      appContext.throwingActivity.startActivity(Intent.createChooser(send, title))
    }

    OnDestroy {
      closeAllStreams()
    }
  }
}
