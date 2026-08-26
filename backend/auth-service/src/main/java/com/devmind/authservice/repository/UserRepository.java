package com.devmind.authservice.repository;

import com.devmind.authservice.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByGithubId(Long githubId);
    boolean existsByEmail(String email);
}
