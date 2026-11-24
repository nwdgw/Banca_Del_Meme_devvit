"""
Esporta il database SQLite esistente di BancaDelMeme (e il DB opzionale dei post Telegram)
in file JSON pronti per la funzione 'Importa DB Legacy' nel menu moderatore Devvit.

Uso (con cfg.json esistente oppure con i percorsi diretti):
  python3 migration/export_db.py --cfg /percorso/cfg.json --out bdb_dump
  python3 migration/export_db.py --db /percorso/db.sqlite3 --posts-db /percorso/posts.sqlite3 --out bdb_dump
"""

import argparse
import json
import os
import sqlite3


def export_sqlite(db_path: str, posts_db_path: str | None, out_prefix: str, chunk_size: int) -> None:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    investors = [
        {
            "name": r["name"],
            "balance": int(r["balance"] or 0),
            "completed": int(r["completed"] or 0),
            "broke": int(r["broke"] or 0),
        }
        for r in cur.execute("SELECT name, balance, completed, broke FROM Investors")
    ]

    investments = [
        {
            "id": str(r["id"]),
            "post": r["post"],
            "upvotes": int(r["upvotes"] or 0),
            "deltatime": int(r["deltatime"] or 0),
            "comment": r["comment"],
            "name": r["name"],
            "amount": int(r["amount"] or 0),
            "time": int(r["time"] or 0),
            "done": bool(r["done"]),
            "response": r["response"] or "0",
            "final_upvotes": int(r["final_upvotes"] or 0),
            "success": bool(r["success"]),
            "profit": int(r["profit"] or 0),
            "net_worth": int(r["net_worth"] or 0),
            "top_networth": int(r["top_networth"] or 0),
            "balance": int(r["balance"] or 0),
            "op": bool(r["op"]),
        }
        for r in cur.execute(
            """
            SELECT id, post, upvotes, deltatime, comment, name, amount, time, done,
                   response, final_upvotes, success, profit, net_worth, top_networth, balance, op
            FROM Investments
            ORDER BY id ASC
            """
        )
    ]

    buyables = [
        {
            "post": r["post"],
            "time": int(r["time"] or 0),
            "response": r["response"] or "0",
            "oc": bool(r["oc"]),
            "done": bool(r["done"]),
            "name": r["name"],
            "final_upvotes": int(r["final_upvotes"] or 0),
            "profit": int(r["profit"] or 0),
            "balance": int(r["balance"] or 0),
        }
        for r in cur.execute(
            """
            SELECT post, time, response, oc, done, name, final_upvotes, profit, balance
            FROM Buyables
            """
        )
    ]
    conn.close()

    telegram_posts = []
    if posts_db_path and os.path.exists(posts_db_path):
        pconn = sqlite3.connect(posts_db_path)
        pconn.row_factory = sqlite3.Row
        telegram_posts = [
            {"rid": r["rid"], "tid": r["tid"]}
            for r in pconn.execute("SELECT rid, tid FROM posts")
        ]
        pconn.close()

    # Suddivide i record in chunk gestibili dal form Devvit
    chunks = []
    for i in range(0, max(1, len(investors)), chunk_size):
        chunks.append({"investors": investors[i : i + chunk_size]})
    for i in range(0, len(investments), chunk_size):
        chunks.append({"investments": investments[i : i + chunk_size]})
    for i in range(0, len(buyables), chunk_size):
        chunks.append({"buyables": buyables[i : i + chunk_size]})
    for i in range(0, len(telegram_posts), chunk_size):
        chunks.append({"telegramPosts": telegram_posts[i : i + chunk_size]})

    os.makedirs(os.path.dirname(out_prefix) or ".", exist_ok=True)
    for idx, payload in enumerate(chunks, start=1):
        filename = f"{out_prefix}_chunk_{idx:03d}.json"
        with open(filename, "w", encoding="utf-8") as fp:
            json.dump(payload, fp, ensure_ascii=False)
        print(f"Creato {filename}")

    print(
        f"Esportazione completata: {len(investors)} investitori, "
        f"{len(investments)} investimenti, {len(buyables)} buyables, "
        f"{len(telegram_posts)} post Telegram in {len(chunks)} file."
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--cfg", default=None, help="Percorso cfg.json del vecchio bot")
    parser.add_argument("--db", default=None, help="Percorso DBFILE (SQLite)")
    parser.add_argument("--posts-db", default=None, help="Percorso POST_DBFILE (SQLite Telegram)")
    parser.add_argument("--out", default="bdb_dump", help="Prefisso file JSON in uscita")
    parser.add_argument("--chunk-size", type=int, default=400, help="Record per file chunk")
    args = parser.parse_args()

    db_path = args.db
    posts_db_path = args.posts_db
    if args.cfg:
        with open(args.cfg, encoding="utf-8") as fp:
            cfg = json.load(fp)
        base_dir = os.path.dirname(os.path.abspath(args.cfg))
        if not db_path and cfg.get("DBFILE"):
            raw_db = cfg["DBFILE"]
            db_path = raw_db if os.path.isabs(raw_db) else os.path.join(base_dir, raw_db)
        if not posts_db_path and cfg.get("POST_DBFILE"):
            raw_posts = cfg["POST_DBFILE"]
            posts_db_path = raw_posts if os.path.isabs(raw_posts) else os.path.join(base_dir, raw_posts)

    if not db_path:
        parser.error("Specificare --cfg oppure --db.")

    export_sqlite(db_path, posts_db_path, args.out, args.chunk_size)
