CREATE TABLE pr_reviews (
    id                    CHAR(36)     NOT NULL PRIMARY KEY,
    repository_id         CHAR(36)     NOT NULL,
    pr_number             INT          NOT NULL,
    pr_title              VARCHAR(512)     NULL,
    head_sha              VARCHAR(64)      NULL,
    base_sha              VARCHAR(64)      NULL,
    status                VARCHAR(32)  NOT NULL DEFAULT 'PENDING',
    files_reviewed        INT          NOT NULL DEFAULT 0,
    findings_count        INT          NOT NULL DEFAULT 0,
    summary               TEXT             NULL,
    error_message         VARCHAR(2048)    NULL,
    requested_by_user_id  CHAR(36)     NOT NULL,
    created_at            DATETIME(6)  NOT NULL,
    completed_at          DATETIME(6)      NULL,

    CONSTRAINT chk_pr_reviews_status
        CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED'))
);

CREATE INDEX idx_pr_reviews_repo_pr ON pr_reviews (repository_id, pr_number);
CREATE INDEX idx_pr_reviews_repo_created ON pr_reviews (repository_id, created_at);

CREATE TABLE pr_review_findings (
    id            CHAR(36)     NOT NULL PRIMARY KEY,
    review_id     CHAR(36)     NOT NULL,
    file_path     VARCHAR(1024) NOT NULL,
    severity      VARCHAR(16)  NOT NULL,
    message       TEXT         NOT NULL,
    line_number   INT              NULL,
    grounded      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    DATETIME(6)  NOT NULL,

    CONSTRAINT fk_pr_review_findings_review
        FOREIGN KEY (review_id) REFERENCES pr_reviews (id) ON DELETE CASCADE,
    CONSTRAINT chk_pr_review_findings_severity
        CHECK (severity IN ('INFO', 'MINOR', 'MAJOR', 'CRITICAL'))
);

CREATE INDEX idx_pr_review_findings_review_id ON pr_review_findings (review_id);
