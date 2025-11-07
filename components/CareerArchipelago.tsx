import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { CareerPath } from '../types';
import { FILTER_CATEGORIES, getNodeColors } from './Step3Explore';

interface CareerArchipelagoProps {
  careerPaths: CareerPath[];
  onNodeClick: (path: CareerPath) => void;
  onYouNodeClick: () => void;
}

const demandWidthMap: { [key: string]: number } = {
  'high': 1,
  'growing': 0.85,
  'medium': 0.7,
  'stable': 0.7,
  'low': 0.55,
};

const CareerArchipelago: React.FC<CareerArchipelagoProps> = ({ careerPaths, onNodeClick, onYouNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const svgNode = svgRef.current;
    const { width, height } = svgNode.getBoundingClientRect();
    
    svg.selectAll("*").remove();

    if (careerPaths.length === 0) return;
    
    const isMobile = width < 768;

    const margin = isMobile
      ? { top: 40, right: 10, bottom: 40, left: 10 }
      : { top: 100, right: 100, bottom: 100, left: 100 };
    
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const outerRadius = Math.min(chartWidth, chartHeight) / 2;
    const innerRadius = isMobile ? 40 : 80;

    const tooltip = d3.select("#tooltip");

    const chart = svg.append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const defs = svg.append("defs");

    const uniqueGradients = new Map<string, string[]>();

    careerPaths.forEach(path => {
        const { colors, sources } = getNodeColors(path);
        if (colors.length > 1) {
            const key = sources.join('-');
            if (!uniqueGradients.has(key)) {
                uniqueGradients.set(key, colors);
            }
        }
    });

    uniqueGradients.forEach((colors, key) => {
        const gradient = defs.append("linearGradient")
            .attr("id", `grad-${key}`)
            .attr("x1", "0%")
            .attr("x2", "100%")
            .attr("y1", "0%")
            .attr("y2", "0%");

        colors.forEach((color, i) => {
            const offset = colors.length > 1 ? (i / (colors.length - 1)) * 100 : 50;
            gradient.append("stop")
                .attr("offset", `${offset}%`)
                .attr("stop-color", color);
        });
    });


    const x = d3.scaleBand()
        .range([0, 2 * Math.PI])
        .align(0)
        .domain(careerPaths.map(d => d.title));

    const y = d3.scaleRadial()
        .range([innerRadius, outerRadius])
        .domain([0, 100]);
        
    // --- Draw Bars ---
    const bars = chart.selectAll(".bar")
        .data(careerPaths)
        .enter()
        .append("path")
        .attr("class", "bar cursor-pointer")
        .attr("fill", d => {
            const { colors, sources } = getNodeColors(d);
            if (colors.length > 1) {
                return `url(#grad-${sources.join('-')})`;
            }
            return colors[0] || '#64748b';
        })
        .attr("d", d3.arc<CareerPath>()
            .innerRadius(innerRadius)
            .outerRadius(innerRadius) // Start at inner radius for animation
            .startAngle(d => x(d.title)!)
            .endAngle(d => x(d.title)! + x.bandwidth())
            .padAngle(0.02)
            .padRadius(innerRadius)
        );
        
    bars.transition()
        .duration(800)
        .delay((d, i) => i * 30)
        .ease(d3.easeCubicOut)
        .attr("d", d3.arc<CareerPath>()
            .innerRadius(innerRadius)
            .outerRadius(d => y(d.skillMatchPercentage)!)
            .startAngle(d => {
                const center = x(d.title)! + x.bandwidth() / 2;
                const width = demandWidthMap[d.marketDemand.toLowerCase().trim()] || 0.7;
                return center - (x.bandwidth() * width / 2);
            })
            .endAngle(d => {
                const center = x(d.title)! + x.bandwidth() / 2;
                const width = demandWidthMap[d.marketDemand.toLowerCase().trim()] || 0.7;
                return center + (x.bandwidth() * width / 2);
            })
            .padAngle(0.02)
            .padRadius(innerRadius)
        );

    // --- Draw Labels ---
    const labels = chart.append("g")
      .selectAll("g")
      .data(careerPaths)
      .enter()
      .append("g")
        .attr("text-anchor", "middle")
        .attr("transform", d => {
            const r = y(d.skillMatchPercentage)! + 10;
            const angle = (x(d.title)! + x.bandwidth() / 2) * 180 / Math.PI - 90;
            return `rotate(${angle}) translate(${r},0)`;
        });

    labels.append("text")
        .attr("transform", (d, i) => {
            const angle = (x(d.title)! + x.bandwidth() / 2) * 180 / Math.PI - 90;
            return (angle > 90 && angle < 270) ? "rotate(180)" : "rotate(0)";
        })
        .attr("dy", "0.35em")
        .attr("fill", "#94a3b8")
        .attr("font-size", isMobile ? "10px" : "12px")
        .style("pointer-events", "none")
        .style("display", isMobile ? "none" : null)
        .attr("opacity", 0)
        .text(d => d.title)
        .call(wrap, 150) // Wrap text
        .transition()
        .duration(500)
        .delay(1000)
        .attr("opacity", 1);


    // --- Central "You" Node ---
    const centerGroup = chart.append("g")
        .attr("class", "center-group cursor-pointer")
        .on("click", onYouNodeClick);

    centerGroup.html(`
        <g class="center-node-container" style="transform: scale(${isMobile ? 0.6 : 0.9}); transition: transform 0.2s ease-in-out;">
            <circle r="65" fill="#1e293b" opacity="0.5"></circle>
            <circle r="50" fill="#334155" opacity="0.6"></circle>
            <circle r="35" fill="#475569" opacity="0.8"></circle>
            <text y="8" text-anchor="middle" font-size="20" font-weight="bold" fill="#94a3b8">You</text>
        </g>
    `);

    centerGroup.on("mouseover", function() {
        d3.select(this).select('.center-node-container').style('transform', `scale(${isMobile ? 0.65 : 0.95})`);
    }).on("mouseout", function() {
        d3.select(this).select('.center-node-container').style('transform', `scale(${isMobile ? 0.6 : 0.9})`);
    });
    
    // Grid lines
    chart.append("g")
      .attr("text-anchor", "middle")
      .selectAll("g")
      .data(y.ticks(4).slice(1))
      .enter()
      .append("g")
      .attr("fill", "none")
      .call(g => g.append("circle")
          .attr("stroke", "#334155")
          .attr("stroke-opacity", 0.5)
          .attr("stroke-dasharray", "4,4")
          .attr("r", y))
      .call(g => g.append("text")
          .attr("y", d => -y(d))
          .attr("dy", "0.35em")
          .attr("fill", "#475569")
          .attr("font-size", isMobile ? "9px" : "10px")
          .text(y.tickFormat(4, "s"))
          .clone(true)
          .attr("fill", "#475569")
          .attr("y", d => y(d)));


    // --- Interactivity ---
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    bars.on("click", (event, d) => {
      onNodeClick(d);
    });

    if (!isTouchDevice) {
      bars.on("mouseover", function(event, d) {
          d3.select(this)
            .attr("stroke", "#f1f5f9")
            .attr("stroke-width", 2);
          
          chart.selectAll(".bar").filter((p: any) => p !== d)
              .transition().duration(200)
              .style("opacity", 0.3);
          
          labels.filter((p: any) => p !== d)
              .transition().duration(200)
              .style("opacity", 0.3);

          tooltip.transition().duration(200).style("opacity", 1);
          tooltip.html(`
              <div class="font-bold text-base mb-1">${d.title}</div>
              <div class="text-xs text-slate-400 mb-2">${d.industry}</div>
              <div class="text-sm font-semibold text-slate-200">Match: ${d.skillMatchPercentage}%</div>
              <div class="text-sm font-semibold text-slate-200">Demand: ${d.marketDemand}</div>
          `)
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function(event, d) {
          d3.select(this)
            .attr("stroke", "none");
            
          chart.selectAll(".bar").transition().duration(200).style("opacity", 1);
          labels.transition().duration(200).style("opacity", 1);

          tooltip.transition().duration(500).style("opacity", 0);
      });
    }

    // Text wrapping function
    function wrap(text: d3.Selection<d3.BaseType | SVGTextElement, CareerPath, SVGGElement, unknown>, width: number) {
      text.each(function () {
        const text = d3.select(this);
        const words = text.text().split(/\s+/).reverse();
        let word;
        let line: string[] = [];
        let lineNumber = 0;
        const lineHeight = 1.1; // ems
        const dy = parseFloat(text.attr("dy"));
        let tspan = text.text(null)
          .append("tspan")
          .attr("x", 0)
          .attr("dy", dy + "em");
    
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node()!.getComputedTextLength() > width && line.length > 1) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan")
              .attr("x", 0)
              .attr("dy", ++lineNumber * lineHeight + dy + "em")
              .text(word);
          }
        }
      });
    }

  }, [careerPaths, onNodeClick, onYouNodeClick]);


  return <svg ref={svgRef} className="w-full h-full"></svg>;
};

export default CareerArchipelago;