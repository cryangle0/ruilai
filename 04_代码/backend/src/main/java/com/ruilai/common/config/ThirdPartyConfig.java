package com.ruilai.common.config;

import com.ruilai.common.thirdparty.ThirdPartyProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(ThirdPartyProperties.class)
public class ThirdPartyConfig {

    @Bean
    public RestClient thirdPartyRestClient(RestClient.Builder builder) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(4000);
        factory.setReadTimeout(6000);
        return builder.requestFactory(factory).build();
    }
}
