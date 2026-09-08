package com.ruilai.common.storage;

import com.ruilai.common.web.BizException;
import com.ruilai.common.web.ErrCode;
import org.springframework.web.multipart.MultipartFile;

import java.util.Locale;
import java.util.Set;

public final class UploadChecks {

    public static final Set<String> ALLOWED = Set.of(
            "jpg", "jpeg", "png", "webp", "gif", "pdf", "mp4", "xlsx", "xls", "doc", "docx", "zip");
    public static final Set<String> IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "gif");
    public static final Set<String> VIDEO_EXTENSIONS = Set.of("mp4", "mov", "webm");
    public static final long MAX_BYTES = 40L * 1024 * 1024;

    private UploadChecks() {
    }

    public static String checkedExtension(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BizException(ErrCode.BAD_REQUEST, "请选择要上传的文件");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BizException(ErrCode.BAD_REQUEST, "文件大小不能超过 40MB");
        }
        String ext = extension(file.getOriginalFilename());
        if (!ALLOWED.contains(ext)) {
            throw new BizException(ErrCode.BAD_REQUEST, "不支持的文件类型:" + ext);
        }
        return ext;
    }

    public static boolean isVideo(String ext) {
        return VIDEO_EXTENSIONS.contains(ext);
    }

    public static boolean isImage(String ext) {
        return IMAGE_EXTENSIONS.contains(ext);
    }

    public static boolean isDocument(String ext) {
        return !isVideo(ext) && !isImage(ext);
    }

    static String extension(String filename) {
        if (filename == null) {
            return "\0";
        }
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) {
            return "\0";
        }
        return filename.substring(dot + 1).toLowerCase(Locale.ROOT);
    }
}
