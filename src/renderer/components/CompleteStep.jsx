import React, { useContext, useState, useEffect } from 'react';
import { LanguageContext } from '../context/Language';

export const CompleteStep = ({ setupResponse, serviceStatus, onFinish, onReinstall }) => {
    const [status, setStatus] = useState(serviceStatus);
    const { localization } = useContext(LanguageContext);

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
            <h2>{localization?.setup?.completeStep?.title || "Installation Complete!"}</h2>
            <p className="success-message">
                {localization?.setup?.completeStep?.successMessage || "The IHS Client Node service has been successfully installed and configured."}
            </p>

            <div className="complete-details">
                <div className="detail-section">
                    <h3>{localization?.setup?.completeStep?.serviceInformation || "Service Information"}</h3>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <label>{localization?.setup?.completeStep?.serviceName || "Service Name"}</label>
                            <span>{status?.serviceName || 'IHSPortalClientService'}</span>
                        </div>
                        <div className="detail-item">
                            <label>{localization?.setup?.completeStep?.status || "Status"}</label>
                            <span className={`status-badge ${status?.isRunning ? 'running' : 'stopped'}`}>
                                {status?.isRunning
                                    ? localization?.setup?.completeStep?.running || "🟢 Running"
                                    : localization?.setup?.completeStep?.stopped || "🔴 Stopped"}
                                <button onClick={checkStatus} className="btn-refresh">
                                    🔄
                                </button>
                            </span>
                        </div>
                        <div className="detail-item">
                            <label>{localization?.setup?.completeStep?.nodeId || "Node ID"}</label>
                            <span>{setupResponse?.nodeId}</span>
                        </div>
                        <div className="detail-item">
                            <label>{localization?.setup?.completeStep?.clientKey || "Client Key"}</label>
                            <span className="key-display">{setupResponse?.clientKey}</span>
                        </div>
                    </div>
                </div>

                <div className="detail-section">
                    <h3>{localization?.setup?.completeStep?.nextSteps || "Next Steps"}</h3>
                    <ul className="next-steps">
                        <li>{localization?.setup?.completeStep?.serviceInstalled || "✅ Service installed and configured to start with Windows"}</li>
                        <li>{localization?.setup?.completeStep?.clientKeyGenerated || "✅ Client key generated and stored securely"}</li>
                        <li>{localization?.setup?.completeStep?.configurationSaved || "✅ Configuration saved to appsettings.json"}</li>
                        <li>{localization?.setup?.completeStep?.serviceConnect || "🔄 Service will automatically connect to the portal"}</li>
                        <li>{localization?.setup?.completeStep?.monitorService || "📊 Monitor service status from Windows Services (services.msc)"}</li>
                    </ul>
                </div>
            </div>

            <div className="complete-actions">
                <button onClick={onFinish} className="btn-primary">
                    {localization?.setup?.completeStep?.finish || "Finish"}
                </button>
                <button onClick={onReinstall} className="btn-secondary">
                    {localization?.setup?.completeStep?.reinstall || "Reinstall"}
                </button>
            </div>
        </div>
    );
};
