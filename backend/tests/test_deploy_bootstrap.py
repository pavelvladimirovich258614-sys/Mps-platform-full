from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def test_pre_cert_nginx_template_is_http_only_and_keeps_domain_placeholder() -> None:
    config = (ROOT / "deploy" / "nginx.pre-cert.conf").read_text(encoding="utf-8")
    production_config = (ROOT / "deploy" / "nginx.conf").read_text(encoding="utf-8")
    deploy_guide = (ROOT / "DEPLOY.md").read_text(encoding="utf-8")

    assert "listen 80;" in config
    assert "listen 443" not in config
    assert "ssl_certificate" not in config
    assert "YOUR_DOMAIN" in config
    assert "mir.pod-solncem.ru" not in config
    assert "/.well-known/acme-challenge/" in config
    assert "YOUR_DOMAIN" in production_config
    assert "YOUR_DOMAIN" in deploy_guide
    assert "mir.pod-solncem.ru" not in production_config
    assert "mir.pod-solncem.ru" not in deploy_guide


def test_digest_unit_uses_the_production_service_account_and_environment() -> None:
    unit = (ROOT / "deploy" / "mps-digest.service").read_text(encoding="utf-8")

    assert "User=mps" in unit
    assert "Group=mps" in unit
    assert "EnvironmentFile=/etc/mps-platform/backend.env" in unit


def test_production_nginx_allows_media_multipart_overhead() -> None:
    config = (ROOT / "deploy" / "nginx.conf").read_text(encoding="utf-8")

    # FastAPI validates the raw file at 10 MiB, so nginx must admit the
    # slightly larger multipart request and let the endpoint return JSON.
    assert "client_max_body_size 11m;" in config
