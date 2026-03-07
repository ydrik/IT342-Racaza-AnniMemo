package edu.cit.racaza.annimemo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("!local")
public class DatabaseConfigurationValidator implements ApplicationRunner {

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

    @Value("${spring.datasource.username:}")
    private String datasourceUsername;

    @Value("${spring.datasource.password:}")
    private String datasourcePassword;

    @Override
    public void run(ApplicationArguments args) {
        if (isBlank(datasourceUrl) || isBlank(datasourceUsername) || isBlank(datasourcePassword)) {
            throw new IllegalStateException(
                    "Supabase/PostgreSQL database config is missing. "
                            + "Set DB_URL, DB_USERNAME, and DB_PASSWORD in backend/.env "
                            + "or environment variables. "
                            + "If you intentionally want H2, run with SPRING_PROFILES_ACTIVE=local."
            );
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
