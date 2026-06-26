package com.devready.backend_user.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

/**
 * Colab FastAPI(AI 서버) 호출용 RestClient 빈.
 * - baseUrl = ${ai.server.url} (= .env 의 AI_SERVER_URL, 프론트에는 비노출)
 * - read timeout 120s : AI 추론 지연(Budget Forcing 최악 ~90s) 대비
 * - SimpleClientHttpRequestFactory(JDK) 사용 → 추가 의존성 0 (webflux 불필요)
 */
@Configuration
public class RestClientConfig {

    @Bean
    public RestClient aiRestClient(@Value("${ai.server.url:}") String baseUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(10));
        factory.setReadTimeout(Duration.ofSeconds(120));
        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
    }
}
