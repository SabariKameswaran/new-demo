import { LitElement, html, css } from 'lit';

// Utility function for generating unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// MindMapCanvas component
class MindMapCanvas extends LitElement {
  static properties = {
    nodes: { type: Array },
    edges: { type: Array },
    scale: { type: Number },
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
      position: relative;
    }
    .mind-map-canvas {
      position: absolute;
      top: 0;
      left: 0;
      transform-origin: 0 0;
    }
  `;

  constructor() {
    super();
    this.nodes = [];
    this.edges = [];
    this.scale = 1;
  }

  render() {
    return html`
      <div class="mind-map-canvas" style="transform: scale(${this.scale})">
        ${this.nodes.map(node => html`
          <mind-map-node 
            .data=${node} 
            @node-moved=${this.handleNodeMoved}
            @node-selected=${this.handleNodeSelected}
          ></mind-map-node>
        `)}
        ${this.edges.map(edge => html`
          <mind-map-edge .data=${edge}></mind-map-edge>
        `)}
      </div>
    `;
  }

  handleNodeMoved(e) {
    const { id, x, y } = e.detail;
    this.nodes = this.nodes.map(node => 
      node.id === id ? { ...node, x, y } : node
    );
    this.requestUpdate();
  }

  handleNodeSelected(e) {
    const { id } = e.detail;
    // Implement selection logic here
  }

  addNode(content, x, y) {
    const newNode = { id: generateId(), content, x, y };
    this.nodes = [...this.nodes, newNode];
  }

  addEdge(sourceId, targetId) {
    const newEdge = { id: generateId(), sourceId, targetId };
    this.edges = [...this.edges, newEdge];
  }

  zoom(delta) {
    this.scale = Math.max(0.1, Math.min(2, this.scale + delta));
  }
}

customElements.define('mind-map-canvas', MindMapCanvas);

// MindMapNode component
class MindMapNode extends LitElement {
  static properties = {
    data: { type: Object },
  };

  static styles = css`
    :host {
      display: block;
      position: absolute;
      background-color: #f0f0f0;
      border: 1px solid #ccc;
      border-radius: 5px;
      padding: 10px;
      cursor: move;
      user-select: none;
    }
  `;

  render() {
    const { content, x, y } = this.data;
    return html`
      <div style="left: ${x}px; top: ${y}px;">
        ${content}
      </div>
    `;
  }

  firstUpdated() {
    this.addEventListener('mousedown', this.onDragStart);
  }

  onDragStart(e) {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = this.data.x;
    const startTop = this.data.y;

    const onDrag = (e) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newX = startLeft + dx;
      const newY = startTop + dy;
      this.updatePosition(newX, newY);
    };

    const onDragEnd = () => {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', onDragEnd);
    };

    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', onDragEnd);
  }

  updatePosition(x, y) {
    this.dispatchEvent(new CustomEvent('node-moved', { 
      detail: { id: this.data.id, x, y },
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('mind-map-node', MindMapNode);

// MindMapEdge component
class MindMapEdge extends LitElement {
  static properties = {
    data: { type: Object },
  };

  static styles = css`
    :host {
      display: block;
      position: absolute;
      pointer-events: none;
    }
    svg {
      overflow: visible;
    }
    path {
      stroke: #999;
      stroke-width: 2px;
      fill: none;
    }
  `;

  render() {
    const { sourceId, targetId } = this.data;
    const sourceNode = this.parentElement.querySelector(`mind-map-node[data-id="${sourceId}"]`);
    const targetNode = this.parentElement.querySelector(`mind-map-node[data-id="${targetId}"]`);

    if (!sourceNode || !targetNode) {
      return html``;
    }

    const sourceRect = sourceNode.getBoundingClientRect();
    const targetRect = targetNode.getBoundingClientRect();

    const startX = sourceRect.left + sourceRect.width / 2;
    const startY = sourceRect.top + sourceRect.height / 2;
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;

    return html`
      <svg width="100%" height="100%">
        <path d="M ${startX} ${startY} L ${endX} ${endY}"></path>
      </svg>
    `;
  }
}

customElements.define('mind-map-edge', MindMapEdge);

// Usage example
class MindMapApp extends LitElement {
  render() {
    return html`
      <mind-map-canvas id="mindMap"></mind-map-canvas>
      <button @click=${this.addNode}>Add Node</button>
      <button @click=${this.addEdge}>Add Edge</button>
      <button @click=${() => this.zoom(0.1)}>Zoom In</button>
      <button @click=${() => this.zoom(-0.1)}>Zoom Out</button>
    `;
  }

  firstUpdated() {
    this.mindMap = this.shadowRoot.getElementById('mindMap');
  }

  addNode() {
    const content = prompt('Enter node content:');
    if (content) {
      this.mindMap.addNode(content, Math.random() * 500, Math.random() * 500);
    }
  }

  addEdge() {
    const sourceId = prompt('Enter source node ID:');
    const targetId = prompt('Enter target node ID:');
    if (sourceId && targetId) {
      this.mindMap.addEdge(sourceId, targetId);
    }
  }

  zoom(delta) {
    this.mindMap.zoom(delta);
  }
}

customElements.define('mind-map-app', MindMapApp);