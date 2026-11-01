package expo.modules.fileaccessnative

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.DocumentsContract
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.FileNotFoundException

internal class InvalidDocumentUriException(uri: String) :
  CodedException("ERR_FILE_ACCESS_INVALID_URI", "Not a document URI: $uri", null)

internal class PermissionLostException(uri: String, cause: Throwable) :
  CodedException("ERR_FILE_ACCESS_PERMISSION_LOST", "No access to: $uri", cause)

internal class DocumentNotFoundException(uri: String, cause: Throwable) :
  CodedException("ERR_FILE_ACCESS_NOT_FOUND", "Document not found: $uri", cause)

internal class RenameFailedException(uri: String, cause: Throwable) :
  CodedException("ERR_FILE_ACCESS_RENAME_FAILED", "Could not rename: $uri", cause)

/**
 * expo-file-system(SDK 54)이 제공하지 않는 SAF 기능만 담는다.
 * - 유지 중인 URI 권한 조회·해제: Expo는 권한을 얻기만 하고 조회·해제 API가 없다.
 * - SAF 문서 이름 변경: Expo의 rename은 java.io.File 기반이라 content URI에서 예외가 난다.
 */
class FileAccessNativeModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

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
  }
}
