CREATE TABLE repo_commits (
    id             CHAR(36)      NOT NULL PRIMARY KEY,
    repository_id  CHAR(36)      NOT NULL,
    sha            VARCHAR(40)   NOT NULL,
    author_login   VARCHAR(255)      NULL,
    author_name    VARCHAR(255)      NULL,
    message        VARCHAR(1024)     NULL,
    committed_at   DATETIME(6)   NOT NULL,
    created_at     DATETIME(6)   NOT NULL,

    CONSTRAINT uq_repo_commits_repo_sha UNIQUE (repository_id, sha)
);

CREATE INDEX idx_repo_commits_repo_committed ON repo_commits (repository_id, committed_at);
CREATE INDEX idx_repo_commits_repo_author ON repo_commits (repository_id, author_login);

CREATE TABLE repo_pull_requests (
    id             CHAR(36)      NOT NULL PRIMARY KEY,
    repository_id  CHAR(36)      NOT NULL,
    pr_number      INT           NOT NULL,
    title          VARCHAR(512)      NULL,
    state          VARCHAR(16)   NOT NULL,
    author_login   VARCHAR(255)      NULL,
    opened_at      DATETIME(6)   NOT NULL,
    closed_at      DATETIME(6)       NULL,
    merged_at      DATETIME(6)       NULL,
    synced_at      DATETIME(6)   NOT NULL,

    CONSTRAINT uq_repo_pull_requests_repo_number UNIQUE (repository_id, pr_number),
    CONSTRAINT chk_repo_pull_requests_stat
    CHECK (state IN ('OPEN', 'CLOSED', 'MERGED'))
);

CREATE INDEX idx_repo_pull_requests_repo_opened ON repo_pull_requests (repository_id, opened_at);