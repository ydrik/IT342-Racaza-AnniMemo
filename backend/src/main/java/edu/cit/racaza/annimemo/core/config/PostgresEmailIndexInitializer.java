package edu.cit.racaza.annimemo.core.config;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;
import javax.sql.DataSource;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Profile("!local")
public class PostgresEmailIndexInitializer implements ApplicationRunner {

    private static final String CREATE_CASE_INSENSITIVE_EMAIL_INDEX =
            "CREATE UNIQUE INDEX IF NOT EXISTS uk_app_users_email_ci ON app_users (lower(email))";

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public PostgresEmailIndexInitializer(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!isPostgres()) {
            return;
        }

        try {
            jdbcTemplate.execute(CREATE_CASE_INSENSITIVE_EMAIL_INDEX);
        } catch (DataAccessException ex) {
            throw new IllegalStateException(
                    "Failed to enforce case-insensitive unique email index on app_users. "
                            + "Resolve existing duplicate emails (case-insensitive) and restart.",
                    ex
            );
        }
    }

    private boolean isPostgres() {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            String productName = metaData.getDatabaseProductName();
            return productName != null && productName.toLowerCase().contains("postgresql");
        } catch (SQLException ex) {
            throw new IllegalStateException("Unable to inspect database metadata for index initialization", ex);
        }
    }
}
