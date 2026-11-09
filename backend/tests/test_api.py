import os
from pathlib import Path
import sys

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ["DATABASE_PATH"] = "/tmp/neon_vault_pytest_scores.db"
import main  # noqa: E402


def test_health():
    with TestClient(main.app) as client:
        assert client.get('/api/health').json() == {'status': 'ok'}


def test_scores_and_ranking(tmp_path):
    main.DATABASE = tmp_path / 'scores.db'
    with TestClient(main.app) as client:
        assert client.get('/api/leaderboard').json() == []
        assert client.post('/api/scores', json={'name':'Nova', 'score':950, 'level':3}).status_code == 201
        assert client.post('/api/scores', json={'name':'Astra', 'score':1450, 'level':5}).status_code == 201
        results = client.get('/api/leaderboard').json()
        assert [r['name'] for r in results] == ['Astra', 'Nova']
        assert client.post('/api/scores', json={'name':'!','score':400,'level':1}).status_code == 422
        assert client.post('/api/scores', json={'name':'Nova','score':-3,'level':1}).status_code == 422
        assert client.post('/api/scores', json={'name':'Nova','score':50,'level':1}).status_code == 400
