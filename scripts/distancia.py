#!/usr/bin/env python3
"""Distância em linha reta (grande círculo) entre aeroportos, em km e milhas.

Útil para estimar tempo de voo, comparar rotas e checar tabelas de emissão
baseadas em distância. É uma ESTIMATIVA: as companhias usam tabelas próprias.

Dados: data/aeroportos.json (derivado do OpenFlights, licença ODbL).

Uso:
    python3 scripts/distancia.py GRU LIS
    python3 scripts/distancia.py GRU LIS MAD GRU
    python3 scripts/distancia.py --json GRU LIS
"""
import argparse
import json
import math
import sys
from pathlib import Path

RAIO_TERRA_KM = 6371.0088
KM_POR_MILHA = 1.609344
ARQUIVO = Path(__file__).resolve().parent.parent / "data" / "aeroportos.json"


def haversine_km(lat1, lon1, lat2, lon2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * RAIO_TERRA_KM * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("aeroportos", nargs="+", help="Códigos IATA na ordem do itinerário")
    ap.add_argument("--json", action="store_true", help="Saída em JSON")
    args = ap.parse_args()

    codigos = [c.strip().upper() for c in args.aeroportos]
    if len(codigos) < 2:
        sys.exit("Informe pelo menos dois aeroportos.")

    base = json.loads(ARQUIVO.read_text(encoding="utf-8"))["airports"]
    faltando = [c for c in codigos if c not in base]
    if faltando:
        sys.exit(f"Aeroporto(s) não encontrado(s): {', '.join(faltando)}")

    trechos, total = [], 0.0
    for a, b in zip(codigos, codigos[1:]):
        km = haversine_km(base[a]["lat"], base[a]["lon"], base[b]["lat"], base[b]["lon"])
        total += km
        trechos.append({"de": a, "para": b, "km": round(km), "milhas": round(km / KM_POR_MILHA)})

    if args.json:
        print(json.dumps({"trechos": trechos, "total_km": round(total),
                          "total_milhas": round(total / KM_POR_MILHA)}, ensure_ascii=False, indent=2))
        return

    for t in trechos:
        print(f"{t['de']} → {t['para']}: {t['km']:,} km ({t['milhas']:,} mi)".replace(",", "."))
    if len(trechos) > 1:
        print(f"Total: {round(total):,} km ({round(total / KM_POR_MILHA):,} mi)".replace(",", "."))


if __name__ == "__main__":
    main()
