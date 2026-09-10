package com.payvault.user.service;

import com.payvault.common.security.JwtTokenProvider;
import com.payvault.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JwtService {

    private final JwtTokenProvider jwtTokenProvider;

    public String generateToken(User user) {
        return jwtTokenProvider.createToken(
                user.getId(),
                user.getUsername(),
                List.of("ROLE_" + user.getRole())
        );
    }

    public boolean validateToken(String token) {
        return jwtTokenProvider.validateToken(token);
    }
}
