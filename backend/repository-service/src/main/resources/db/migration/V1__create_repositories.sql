CREATE TABLE repositories (
    id                 CHAR(36)     NOT NULL PRIMARY KEY,
    github_repo_id     BIGINT       NOT NULL,
    full_name          VARCHAR(255) NOT NULL,
    name               VARCHAR(255) NOT NULL,
    owner              VARCHAR(255) NOT NULL,
    description        VARCHAR(1024)    NULL,
    html_url           VARCHAR(512) NOT NULL,
    default_branch     VARCHAR(255) NOT NULL DEFAULT 'main',
    primary_language   VARCHAR(64)      NULL,
    is_private         BOOLEAN      NOT NULL DEFAULT FALSE,
    connected_by_user_id CHAR(36)   NOT NULL,
    indexing_status    VARCHAR(32)  NOT NULL DEFAULT 'IDLE',
    stars_count        INT          NOT NULL DEFAULT 0,
    forks_count        INT          NOT NULL DEFAULT 0,
    created_at         DATETIME(6)  NOT NULL,
    updated_at         DATETIME(6)  NOT NULL,

    CONSTRAINT uq_repositories_github_repo_id UNIQUE (github_repo_id),
    CONSTRAINT chk_repositories_indexing_status
        CHECK (indexing_status IN ('IDLE', 'INDEXING', 'COMPLETED', 'FAILED'))
);

CREATE INDEX idx_repositories_connected_by ON repositories (connected_by_user_id);
