import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { CareerPath } from '../types';
import { FILTER_CATEGORIES } from './Step3Explore';

interface CareerArchipelagoProps {
  careerPaths: CareerPath[];
  onNodeClick: (path: CareerPath) => void;
}

const getNodeColor = (path: CareerPath): string => {
    const sourcePriority = ['experience', 'education', 'skill', 'interest'];
    for (const source of sourcePriority) {
        if (path.relevanceTags.some(tag => tag.source === source)) {
            const categoryName = Object.keys(FILTER_CATEGORIES).find(
                key => FILTER_CATEGORIES[key as keyof typeof FILTER_CATEGORIES].source === source
            );
            if (categoryName) {
                return FILTER_CATEGORIES[categoryName as keyof typeof FILTER_CATEGORIES].color;
            }
        }
    }
    return '#64748b'; // Fallback color (slate-500)
};

const demandWidthMap: { [key: string]: number } = {
  'high': 1,
  'growing': 0.85,
  'medium': 0.7,
  'stable': 0.7,
  'low': 0.55,
};

const CareerArchipelago: React.FC<CareerArchipelagoProps> = ({ careerPaths, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || careerPaths.length === 0) return;

    const svg = d3.select(svgRef.current);
    const svgNode = svgRef.current;
    const { width, height } = svgNode.getBoundingClientRect();
    
    svg.selectAll("*").remove();
    
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

    const x = d3.scaleBand()
        .range([0, 2 * Math.PI])
        .align(0)
        .domain(careerPaths.map(d => d.title));

    const y = d3.scaleRadial()
        .range([innerRadius, outerRadius])
        .domain([0, 100]);
        
    const demandScale = d3.scaleLinear()
        .domain([0.55, 1]) // min and max of demandWidthMap values
        .range([x.bandwidth() * 0.4, x.bandwidth() * 0.9]);

    // --- Draw Bars ---
    const bars = chart.selectAll(".bar")
        .data(careerPaths)
        .enter()
        .append("path")
        .attr("class", "bar cursor-pointer")
        .attr("fill", d => getNodeColor(d))
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
    const centerGroup = chart.append("g").attr("class", "center-group");
    centerGroup.html(`
        <g class="center-node-container" style="transform: scale(${isMobile ? 0.6 : 0.9});">
            <circle r="65" fill="#1e293b" opacity="0.5"></circle>
            <circle r="50" fill="#334155" opacity="0.6"></circle>
            <circle r="35" fill="#475569" opacity="0.8"></circle>
            <text y="8" text-anchor="middle" font-size="20" font-weight="bold" fill="#94a3b8">You</text>
        </g>
    `);
    
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
            .transition().duration(200)
            .attr("fill", d3.color(getNodeColor(d))!.brighter(0.5).toString());
          
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
            .transition().duration(200)
            .attr("fill", getNodeColor(d));
            
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

  }, [careerPaths, onNodeClick]);


  return <svg ref={svgRef} className="w-full h-full"></svg>;
};

export default CareerArchipelago;