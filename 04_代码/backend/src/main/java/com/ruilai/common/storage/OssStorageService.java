package com.ruilai.common.storage;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.ruilai.common.time.ChinaTime;
import com.ruilai.common.web.BizException;
import com.ruilai.common.web.ErrCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Slf4j
@Component
@ConditionalOnProperty(name = "ruilai.oss.enabled", havingValue = "true")
public class OssStorageService implements StorageService {

    private final String endpoint;
    private final String bucket;
    private final String accessKeyId;
    private final String accessKeySecret;
    private final String imagePrefix;
    private final String videoPrefix;
    private final String filePrefix;
    private final String cdnDomain;
    private volatile OSS client;

    public OssStorageService(@Value("${ruilai.oss.endpoint}") String endpoint,
                             @Value("${ruilai.oss.bucket}") String bucket,
                             @Value("${ruilai.oss.access-key-id}") String accessKeyId,
                             @Value("${ruilai.oss.access-key-secret}") String accessKeySecret,
                             @Value("${ruilai.oss.image-prefix:ruilai/images}") String imagePrefix,
                             @Value("${ruilai.oss.video-prefix:ruilai/videos}") String videoPrefix,
                             @Value("${ruilai.oss.file-prefix:ruilai/files}") String filePrefix,
                             @Value("${ruilai.oss.cdn-domain:}") String cdnDomain) {
        this.endpoint = endpoint;
        this.bucket = bucket;
        this.accessKeyId = accessKeyId;
        this.accessKeySecret = accessKeySecret;
        this.imagePrefix = imagePrefix;
        this.videoPrefix = videoPrefix;
        this.filePrefix = filePrefix;
        this.cdnDomain = cdnDomain;
    }

    @Override
    public String store(MultipartFile file) {
        String ext = UploadChecks.checkedExtension(file);
        String prefix = UploadChecks.isVideo(ext) ? videoPrefix
                : (UploadChecks.isDocument(ext) ? filePrefix : imagePrefix);
        String key = objectKey(prefix, ext);
        try (InputStream in = file.getInputStream()) {
            client().putObject(bucket, key, in);
        } catch (BizException e) {
            throw e;
        } catch (Exception e) {
            log.error("OSS 上传失败 key={}", key, e);
            throw new BizException(ErrCode.INTERNAL_ERROR, "文件上传失败");
        }
        return publicUrl(key);
    }

    private String objectKey(String prefix, String ext) {
        String base = prefix == null ? "" : prefix.replaceAll("^/+|/+$", "");
        String month = DateTimeFormatter.ofPattern("yyyyMM").format(ChinaTime.today());
        String name = UUID.randomUUID().toString().replace("-", "") + "." + ext;
        return base + "/" + month + "/" + name;
    }

    private String publicUrl(String key) {
        if (cdnDomain != null && !cdnDomain.isBlank()) {
            String host = cdnDomain.replaceAll("^https?://", "").replaceAll("/+$", "");
            return "https://" + host + "/" + key;
        }
        return "https://" + bucket + "." + endpoint + "/" + key;
    }

    private OSS client() {
        if (client == null) {
            synchronized (this) {
                if (client == null) {
                    client = new OSSClientBuilder().build(endpoint, accessKeyId, accessKeySecret);
                }
            }
        }
        return client;
    }
}
