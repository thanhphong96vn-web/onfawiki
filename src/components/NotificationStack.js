import React from 'react';
import Notification from './Notification';
import './Notification.css';

function NotificationStack({ notifications, onRemove }) {
  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-stack">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration || 3000}
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
}

export default NotificationStack;

