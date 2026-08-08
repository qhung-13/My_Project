import type { DonationAlert } from "../../../types/index";

interface DonationAlertsProps {
  alerts: DonationAlert[];
}

const DonationAlerts = ({ alerts }: DonationAlertsProps) => {
  return (
    <div className="donation-alerts" aria-live="polite" aria-atomic="false">
      {alerts.map((alert) => (
        <div className="donation-alert" key={alert.id}>
          <div className="donation-alert__avatar" aria-hidden="true">
            {alert.fromAvatar ? (
              <img src={alert.fromAvatar} alt="" />
            ) : (
              alert.fromUsername.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="donation-alert__content">
            <span className="donation-alert__username">
              {alert.fromUsername}
            </span>
            <span className="donation-alert__coins">{alert.coins} xu</span>
            {alert.message && (
              <p className="donation-alert__message">{alert.message}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DonationAlerts;
