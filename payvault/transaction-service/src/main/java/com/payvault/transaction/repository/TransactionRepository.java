package com.payvault.transaction.repository;

import com.payvault.transaction.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    Optional<Transaction> findByIdempotencyKey(String idempotencyKey);

    List<Transaction> findBySourceWalletIdOrDestinationWalletIdOrderByCreatedAtDesc(UUID sourceWalletId, UUID destinationWalletId);
}
