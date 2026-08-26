CREATE TABLE users (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255)     NULL, -- null for GitHub-only accounts
    name            VARCHAR(255) NOT NULL,
    avatar_url      VARCHAR(512)     NULL,
    github_id       BIGINT           NULL,
    github_username VARCHAR(255)     NULL,
    role            VARCHAR(32)  NOT NULL DEFAULT 'USER',
    created_at      DATETIME(6)  NOT NULL,
    updated_at      DATETIME(6)  NOT NULL,

    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_github_id UNIQUE (github_id),
    CONSTRAINT chk_users_role CHECK (role IN ('USER', 'DEVELOPER', 'TEAM_ADMIN', 'ADMIN'))
);
