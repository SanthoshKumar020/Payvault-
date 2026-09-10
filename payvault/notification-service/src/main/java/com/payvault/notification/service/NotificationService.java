package com.payvault.notification.service;

import com.payvault.common.event.SagaEvents.TransactionCompletedEvent;
import com.payvault.common.event.SagaEvents.TransactionFailedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@Slf4j
public class NotificationService {

    // Keep an in-memory audit log of simulated sent notifications
    private final List<String> notificationLog = Collections.synchronizedList(new ArrayList<>());

    public void sendTransactionCompletedNotification(TransactionCompletedEvent event) {
        String message = String.format(
                "[EMAIL/SMS SENT @ %s] Dear Customer, your transfer of %s %s (Tx ID: %s) has successfully completed!",
                Instant.now(), event.getAmount(), event.getCurrency(), event.getTransactionId()
        );
        log.info("DISPATCH NOTIFICATION: {}", message);
        notificationLog.add(message);
    }

    public void sendTransactionFailedNotification(TransactionFailedEvent event) {
        String message = String.format(
                "[ALERT SENT @ %s] Notice: Your transfer of %s (Tx ID: %s) could not be completed. Reason: %s. Any debited balance has been refunded.",
                Instant.now(), event.getAmount(), event.getTransactionId(), event.getFailureReason()
        );
        log.warn("DISPATCH FAILURE ALERT: {}", message);
        notificationLog.add(message);
    }

    public List<String> getRecentNotifications() {
        return new ArrayList<>(notificationLog);
    }
}
