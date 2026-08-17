import React, { useState, useEffect } from 'react';

export const CompleteStep = ({ setupResponse, serviceStatus, onFinish, onReinstall }) => {
    const [status, setStatus] = useState(serviceStatus);

    const checkStatus = async () => {
        try {
            const newStatus = await window.setupAPI.getServiceStatus();
            setStatus(newStatus);
        } catch (error) {
            console.error('Failed to check status:', error);
        }
    };

    useEffect(() => {
        const interval = setInterval(checkStatus, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="step-content complete-step">
            <div className="success-icon">✅</div>
            <h2>Installation Complete!</h2>
            <p className="success-message">
                The IHS Client Node service has been successfully installed and configured.
            </p>

            <div className="complete-details">
                <div className="detail-section">
                    <h3>Service Information</h3>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <label>Service Name</label>
                            <span>{status?.serviceName || 'IHSPortalClientService'}</span>
                        </div>
                        <div className="detail-item">
                            <label>Status</label>
                            <span className={`status-badge ${status?.isRunning ? 'running' : 'stopped'}`}>
                                {status?.isRunning ? '🟢 Running' : '🔴 Stopped'}
                                <button onClick={checkStatus} className="btn-refresh">
                                    🔄
                                </button>
                            </span>
                        </div>
                        <div className="detail-item">
                            <label>Node ID</label>
                            <span>{setupResponse?.nodeId}</span>
                        </div>
                        <div className="detail-item">
                            <label>Client Key</label>
                            <span className="key-display">{setupResponse?.clientKey}</span>
                        </div>
                    </div>
                </div>

                <div className="detail-section">
                    <h3>Next Steps</h3>
                    <ul className="next-steps">
                        <li>✅ Service installed and configured to start with Windows</li>
                        <li>✅ Client key generated and stored securely</li>
                        <li>✅ Configuration saved to appsettings.json</li>
                        <li>🔄 Service will automatically connect to the portal</li>
                        <li>📊 Monitor service status from Windows Services (services.msc)</li>
                    </ul>
                </div>
            </div>

            <div className="complete-actions">
                <button onClick={onFinish} className="btn-primary">
                    Finish
                </button>
                <button onClick={onReinstall} className="btn-secondary">
                    Reinstall
                </button>
            </div>
        </div>
    );
};