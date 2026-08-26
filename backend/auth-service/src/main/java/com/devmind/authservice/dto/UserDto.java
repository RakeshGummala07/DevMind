package com.devmind.authservice.dto;

import com.devmind.authservice.domain.Role;
import com.devmind.authservice.domain.User;

public record UserDto(String id, String name, String email, String avatarUrl, Role role) {
    public static UserDto from(User user) {
        return new UserDto(user.getId(), user.getName(), user.getEmail(), user.getAvatarUrl(), user.getRole());
    }
}
