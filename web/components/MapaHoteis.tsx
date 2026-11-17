"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapaML, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Ponto } from "@/lib/geo";

// Mapa dos hotéis com o preço em cada marcador.
// Base: OpenFreeMap (grátis, sem chave, uso comercial permitido; créditos do
// OpenStreetMap exibidos no canto do mapa, como pedem os termos).

export interface PontoHotel extends Ponto {
  id: string;
  rotulo: string; // preço curto
  destaque: boolean; // "melhor escolha"
}

const ESTILO = "https://tiles.openfreemap.org/styles/positron";

function elementoMarcador(p: PontoHotel): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.textContent = p.rotulo;
  el.setAttribute("aria-label", `Hotel de ${p.rotulo}`);
  el.dataset.id = p.id;
  el.className = "marcador-hotel" + (p.destaque ? " marcador-destaque" : "");
  return el;
}

export function MapaHoteis({
  pontos,
  selecionado,
  referencia,
  marcando,
  aoSelecionar,
  aoMarcar,
}: {
  pontos: PontoHotel[];
  selecionado: string | null;
  referencia: Ponto | null;
  marcando: boolean;
  aoSelecionar: (id: string) => void;
  aoMarcar: (p: Ponto) => void;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaML | null>(null);
  const lib = useRef<typeof import("maplibre-gl") | null>(null);
  const marcadores = useRef(new Map<string, { m: Marker; el: HTMLButtonElement }>());
  const marcaRef = useRef<Marker | null>(null);
  const [pronto, setPronto] = useState(false);
  const [falhou, setFalhou] = useState(false);

  // As funções mudam a cada renderização; o mapa usa sempre a mais recente.
  const cb = useRef({ aoSelecionar, aoMarcar, marcando });
  cb.current = { aoSelecionar, aoMarcar, marcando };

  // Cria o mapa uma vez (a biblioteca só carrega no navegador).
  useEffect(() => {
    let cancelado = false;
    import("maplibre-gl")
      .then((ml) => {
        if (cancelado || !caixa.current) return;
        lib.current = ml;
        const m = new ml.Map({
          container: caixa.current,
          style: ESTILO,
          center: [pontos[0]?.lon ?? -46.63, pontos[0]?.lat ?? -23.55],
          zoom: 12,
          attributionControl: { compact: true },
          cooperativeGestures: true, // no celular, rolar a página não mexe no mapa
        });
        m.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");
        m.on("click", (e) => {
          if (cb.current.marcando) cb.current.aoMarcar({ lat: e.lngLat.lat, lon: e.lngLat.lng });
        });
        m.on("load", () => setPronto(true));
        m.on("error", (e) => {
          if (!m.loaded() && /style|fetch|Failed/i.test(String(e?.error?.message ?? ""))) setFalhou(true);
        });
        mapa.current = m;
      })
      .catch(() => setFalhou(true));
    return () => {
      cancelado = true;
      mapa.current?.remove();
      mapa.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Marcadores dos hotéis; reenquadra quando a lista muda.
  useEffect(() => {
    const m = mapa.current;
    const ml = lib.current;
    if (!pronto || !m || !ml) return;
    marcadores.current.forEach(({ m: mk }) => mk.remove());
    marcadores.current.clear();
    const limites = new ml.LngLatBounds();
    for (const p of pontos) {
      const el = elementoMarcador(p);
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        cb.current.aoSelecionar(p.id);
      });
      const mk = new ml.Marker({ element: el, anchor: "bottom" }).setLngLat([p.lon, p.lat]).addTo(m);
      marcadores.current.set(p.id, { m: mk, el });
      limites.extend([p.lon, p.lat]);
    }
    if (pontos.length > 1) m.fitBounds(limites, { padding: 48, maxZoom: 15, duration: 0 });
    else if (pontos.length === 1) m.jumpTo({ center: [pontos[0].lon, pontos[0].lat], zoom: 14 });
  }, [pontos, pronto]);

  // Destaca o hotel escolhido (na lista ou no mapa) e o traz para a vista.
  useEffect(() => {
    const m = mapa.current;
    marcadores.current.forEach(({ el, m: mk }, id) => {
      const ativo = id === selecionado;
      el.classList.toggle("marcador-ativo", ativo);
      mk.getElement().style.zIndex = ativo ? "5" : "";
    });
    const alvo = selecionado ? marcadores.current.get(selecionado) : undefined;
    if (m && alvo) {
      const pos = alvo.m.getLngLat();
      if (!m.getBounds().contains(pos)) m.easeTo({ center: pos, duration: 400 });
    }
  }, [selecionado, pronto]);

  // Ponto de referência (ex.: o evento, o escritório, a praia).
  useEffect(() => {
    const m = mapa.current;
    const ml = lib.current;
    marcaRef.current?.remove();
    marcaRef.current = null;
    if (!pronto || !m || !ml || !referencia) return;
    const el = document.createElement("div");
    el.className = "marcador-referencia";
    el.setAttribute("aria-label", "Ponto de referência");
    el.textContent = "★";
    marcaRef.current = new ml.Marker({ element: el }).setLngLat([referencia.lon, referencia.lat]).addTo(m);
  }, [referencia, pronto]);

  useEffect(() => {
    if (mapa.current) mapa.current.getCanvas().style.cursor = marcando ? "crosshair" : "";
  }, [marcando, pronto]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[20px] border border-borda bg-areia">
      <div ref={caixa} className="h-full w-full" />
      {!pronto && !falhou && <p className="absolute inset-0 flex items-center justify-center text-sm text-suave">Carregando o mapa…</p>}
      {falhou && <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-suave">Não foi possível carregar o mapa agora. A lista continua funcionando.</p>}
    </div>
  );
}
