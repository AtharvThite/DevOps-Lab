import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">DevOps Automation Platform</p>
        <h1>Automated Bug Detection and Deployment System</h1>
        <p>
          Trigger a CI/CD workflow that scans code quality, provisions infrastructure,
          configures servers, and deploys to Multipass or LXD targets.
        </p>
        <button className="primary-btn" onClick={() => navigate("/pipeline")}>
          Run Pipeline
        </button>
      </div>

      <div className="hero-card">
        <h3>Pipeline Flow</h3>
        <ol>
          <li>1. SonarQube quality gate</li>
          <li>2. Terraform provisioning</li>
          <li>3. Ansible configuration</li>
          <li>4. Multipass/LXD deployment</li>
        </ol>
      </div>
    </section>
  );
}
