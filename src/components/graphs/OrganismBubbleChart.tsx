'use client';
import { useEffect, useRef, useState, useMemo, SetStateAction } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3';
import type { Article } from '@/@types/article';

interface Props {
  articles: Article[];
}

interface BubbleNode extends d3.SimulationNodeDatum {
  name: string;
  value: number;
  radius: number;
  color: string;
  vx?: number;
  vy?: number;
}

export default function OrganismBubbleChart({ articles }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [dim, setDim] = useState({ width: 0, height: 0 });

  // 🔹 Monta dados
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of articles) {
      const org = a.article?.experimental_factors?.organism;
      if (org) counts[org] = (counts[org] || 0) + 1;
    }

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...entries.map(e => e[1]), 1);
    const min = Math.min(...entries.map(e => e[1]), 0);

    return entries.map(([name, value], i) => {
      const norm = (value - min) / (max - min || 1);
      const radius = 20 + Math.pow(norm, 0.7) * 70;
      return {
        name,
        value,
        radius,
        color: `hsl(${(i * 137.5) % 360}, 65%, 58%)`,
        x: Math.random() * 100,
        y: Math.random() * 100,
      } as BubbleNode;
    });
  }, [articles]);

  // 🔹 Dimensões do contêiner
  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDim({ width, height });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // 🔹 Física D3
  useEffect(() => {
    if (!svgRef.current || !dim.width || !dim.height) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const nodes = data.map(d => ({ ...d }));

    const groups = svg
      .selectAll('g')
      .data(nodes)
      .join('g')
      .on('mouseenter', (_: any, d: { name: SetStateAction<string | null>; }) => setHovered(d.name))
      .on('mouseleave', () => setHovered(null));

    // Gradientes
    const defs = svg.append('defs');
    nodes.forEach((d, i) => {
      const grad = defs.append('radialGradient').attr('id', `grad-${i}`);
      grad.append('stop').attr('offset', '0%').attr('stop-color', d.color).attr('stop-opacity', 0.95);
      grad.append('stop').attr('offset', '100%').attr('stop-color', d.color).attr('stop-opacity', 0.6);
    });

    // Círculo
    groups
    .append('circle')
    .attr('r', (d: { radius: number }) => d.radius)
    .attr('fill', (_: any, i: number) => `url(#grad-${i})`)
    .attr('stroke', 'white')
    .attr('stroke-opacity', 0.25)
    .attr('opacity', 0.6);


    // Nome
    groups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d: { radius: number; }) => -d.radius * 0.2)
      .attr('font-size', (d: { radius: number; }) => Math.min(14, d.radius * 0.35))
      .attr('font-weight', 600)
      .attr('fill', 'white')
      .attr('opacity', 0.9)
      .style('pointer-events', 'none')
      .text((d: { name: string; }) => (d.name.length > 12 ? d.name.slice(0, 10) + '…' : d.name));

    // Quantidade de artigos
    groups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d: { radius: number; }) => d.radius * 0.3)
      .attr('font-size', (d: { radius: number; }) => Math.max(10, d.radius * 0.25))
      .attr('font-weight', 400)
      .attr('fill', 'white')
      .attr('opacity', 0.8)
      .style('pointer-events', 'none')
      .text((d: { value: any; }) => `${d.value}`);

    // ⚙️ Simulação
    const sim = d3
      .forceSimulation(nodes)
      .velocityDecay(0.18)
      .force(
        'collision',
        d3
          .forceCollide<BubbleNode>()
          .radius((d: { radius: number; }) => d.radius + 1)
          .strength(1)
      )
      .force('center', d3.forceCenter(dim.width / 2, dim.height / 2).strength(0.02))
      .force('charge', d3.forceManyBody<BubbleNode>().strength((d: { radius: number; }) => -d.radius * 0.25))
      .force('float', () => {
        // leve microgravidade + ruído direcional
        nodes.forEach(n => {
          n.vx! += (Math.random() - 0.5) * 0.03;
          n.vy! += (Math.random() - 0.5) * 0.03;
        });
      })
      .on('tick', () => {
        const pad = 4;
        nodes.forEach((d: any) => {
          // colisão com paredes (rebatimento com atrito)
          if (d.x! - d.radius < pad) {
            d.x = d.radius + pad;
            d.vx = Math.abs(d.vx! * 0.8);
          } else if (d.x! + d.radius > dim.width - pad) {
            d.x = dim.width - d.radius - pad;
            d.vx = -Math.abs(d.vx! * 0.8);
          }
          if (d.y! - d.radius < pad) {
            d.y = d.radius + pad;
            d.vy = Math.abs(d.vy! * 0.8);
          } else if (d.y! + d.radius > dim.height - pad) {
            d.y = dim.height - d.radius - pad;
            d.vy = -Math.abs(d.vy! * 0.8);
          }
        });

        groups.attr('transform', (d: BubbleNode) => {
          const x = d.x ?? 0;
          const y = d.y ?? 0;
          return `translate(${x},${y})`;
        });
      }) as any;

    return () => sim.stop();
  }, [data, dim]);

  return (
    <>
        <div className="relative mb-2">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <h3 className="text-white font-semibold text-d">Distribution of Organisms</h3>
                <p className="text-white/60 text-xs">
                {data.length} organisms • {articles.length} articles
                </p>
            </motion.div>
        </div>
        <div
        ref={containerRef}
        className="w-full h-[400px] mb-10 relative rounded-3xl overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl"
        >
        {/* SVG */}
        <svg ref={svgRef} className="absolute inset-0 w-full h-full" />

        {/* Tooltip */}
        <AnimatePresence>
            {hovered && (
            <motion.div
                key={hovered}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-lg px-4 py-2 rounded-xl border border-white/20 shadow-xl pointer-events-none"
            >
                <div className="text-white font-semibold text-sm">{hovered}</div>
                <div className="text-white/70 text-xs">
                {data.find(b => b.name === hovered)?.value} artigos
                </div>
            </motion.div>
            )}
        </AnimatePresence>
        </div>
    </>
  );
}
