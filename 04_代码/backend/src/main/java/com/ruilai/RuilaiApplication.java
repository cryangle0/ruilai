package com.ruilai;

import com.ruilai.common.time.ChinaTime;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@MapperScan("com.ruilai.module.**.mapper")
public class RuilaiApplication {

    public static void main(String[] args) {
        ChinaTime.applyJvmDefault();
        SpringApplication.run(RuilaiApplication.class, args);
    }
}
