package com.ruilai.common.storage;

import com.ruilai.common.web.BizException;
import com.ruilai.common.web.ErrCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Slf4j
@Component
@ConditionalOnProperty(name = "ruilai.oss.enabled", havingValue = "false", matchIfMissing = true)
public class LocalStorageService implements StorageService {

    private final Path root;

    public LocalStorageService(@Value("${ruilai.upload-dir:./data/uploads}") String uploadDir) {
        this.root = Path.of(uploadDir).toAbsolutePath().normalize();
    }

    @Override
    public String store(MultipartFile file) {
        String ext = UploadChecks.checkedExtension(file);
        try {
            Files.createDirectories(root);
            String name = UUID.randomUUID().toString().replace("-", "") + "." + ext;
            Path dest = root.resolve(name);
            file.transferTo(dest);
            return "/files/" + name;
        } catch (BizException e) {
            throw e;
        } catch (Exception e) {
            log.error("本地上传失败", e);
            throw new BizException(ErrCode.INTERNAL_ERROR, "文件上传失败");
        }
    }
}
