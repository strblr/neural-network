import { useEffect } from "react";
import { Box, Sx, useMantineTheme } from "@mantine/core";
import * as d3 from "d3";
import { keyBy } from "lodash-es";
import { Link, useStore } from "@/session/store.tsx";

export default function Main() {
  const theme = useMantineTheme();

  useEffect(() => {
    const svg = d3.select<Element, unknown>("#network-svg");
    const parent = (svg.node() as Element).parentElement!;

    const WIDTH = parent.clientWidth;
    const HEIGHT = parent.clientHeight;
    const MARGIN = 100;
    const LAYER_SPREAD = 170;
    const NODE_SPREAD = 30;
    const TRANSITION = 300;

    svg.style("display", "block").attr("width", WIDTH).attr("height", HEIGHT);

    const view = svg.append("g").classed("network", true);
    const content = view
      .append("g")
      .classed("view", true)
      .attr("transform", `translate(${MARGIN}, ${HEIGHT / 2})`);
    const linkContent = content.append("g").classed("links", true);
    const nodeContent = content.append("g").classed("nodes", true);

    // Zoom

    svg.call(
      d3
        .zoom()
        .scaleExtent([0.1, 10])
        .on("zoom", e => {
          view.attr("transform", e.transform);
        })
    );

    // Scales

    const linkWidthScale = d3
      .scaleLinear()
      .domain([0, 5])
      .range([1, 10])
      .clamp(true);

    const colorScale = d3
      .scaleLinear<string, number>()
      .domain([-1, 0, 1])
      .range([
        theme.colors.orange[4],
        theme.colors.gray[9],
        theme.colors.blue[4]
      ])
      .clamp(true);

    const glowScale = d3
      .scaleLinear()
      .domain([-1, 0, 1])
      .range([0.8, 0, 0.8])
      .clamp(true);
    const glowFilter = (value: number) =>
      `drop-shadow(0 0 8px ${theme.fn.rgba(
        String(colorScale(value)),
        glowScale(value)
      )})`;

    // Draw network

    const draw = () => {
      const { layers } = useStore.getState();

      // Gathering data
      const nodes = layers.flatMap((layer, l) =>
        layer.map((node, n, { length }) => ({
          data: node,
          x: l * LAYER_SPREAD,
          y: -((length - 1) * NODE_SPREAD) / 2 + n * NODE_SPREAD
        }))
      );

      const links = layers.flatMap(layer =>
        layer.flatMap(node => node.outputs)
      );

      const nodeMap = keyBy(nodes, node => node.data.id);

      // Drawing links
      function linkUpdate(
        selection: d3.Selection<SVGPathElement, Link, any, any>
      ) {
        selection
          .attr("stroke", link => colorScale(link.weight))
          .attr("stroke-width", link => linkWidthScale(link.weight))
          .attr("d", link => {
            const source = nodeMap[link.source.id];
            const dest = nodeMap[link.dest.id];
            return `M${source.x},${source.y} C${source.x + 50},${source.y} ${
              dest.x - 50
            },${dest.y} ${dest.x},${dest.y}`;
          });
      }

      linkContent
        .selectAll<SVGPathElement, Link>(".link")
        .data(links, link => link.id)
        .join(
          enter =>
            enter
              .append("path")
              .classed("link", true)
              .attr("fill", "none")
              .attr("stroke-dasharray", "9 1")
              .call(linkUpdate)
              .attr("opacity", 0)
              .transition()
              .duration(TRANSITION)
              .attr("opacity", 1),
          update =>
            update
              .transition()
              .duration(TRANSITION)
              .attr("opacity", 1)
              .call(linkUpdate as any),
          exit =>
            exit.transition().duration(TRANSITION).attr("opacity", 0).remove()
        );

      // Drawing nodes

      function nodeUpdate(
        selection: d3.Selection<
          SVGRectElement,
          (typeof nodes)[number],
          any,
          any
        >
      ) {
        selection
          .attr("x", node => node.x - 10)
          .attr("y", node => node.y - 10)
          .attr("fill", node => colorScale(node.data.output))
          .attr("filter", node => glowFilter(node.data.output));
      }

      nodeContent
        .selectAll<SVGRectElement, (typeof nodes)[number]>(".node")
        .data(nodes, node => node.data.id)
        .join(
          enter =>
            enter
              .append("rect")
              .classed("node", true)
              .attr("z-index", 1)
              .attr("r", 10)
              .attr("width", 20)
              .attr("height", 20)
              .attr("rx", 5)
              .attr("ry", 5)
              .attr("stroke-width", 2)
              .attr("stroke", theme.colors.gray[7])
              .call(nodeUpdate)
              .attr("opacity", 0)
              .transition()
              .duration(TRANSITION)
              .attr("opacity", 1),
          update =>
            update
              .transition()
              .duration(TRANSITION)
              .attr("opacity", 1)
              .call(nodeUpdate as any),
          exit =>
            exit.transition().duration(TRANSITION).attr("opacity", 0).remove()
        );
    };

    draw();

    const unsub = useStore.subscribe((store, previous) => {
      store.layers !== previous.layers && draw();
    });

    return () => {
      unsub();
      svg.selectAll("*").remove();
    };
  }, [theme]);

  return (
    <Box component="main" sx={mainSx}>
      <svg id="network-svg" xmlns="http://www.w3.org/2000/svg" />
    </Box>
  );
}

// Styles

const mainSx: Sx = {
  flexGrow: 1
};
