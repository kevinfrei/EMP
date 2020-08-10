// @flow
import React, { Component } from 'react';
import PropTypes from 'prop-types';

// Local styles pulled from the styles.css file
import './styles/LongList.css';

let containerRef = React.createRef();

// I want to try re-implementing in a functional React component...
export function AnEternalList({
  list,
  component,
  defaultHeight,
}: {
  list: Array<any>,
  component: Function,
  defaultHeight?: number,
}): React$Node {
  return (
    <div>
      <div>eternalList</div>
      <div>Right helper</div>
    </div>
  );
}

type OELNode = {
  top?: number,
  bottom?: number,
  height?: number,
  visible: boolean,
  parent: boolean,
  data?: Array<OELNode>,
  getparent: () => Array<OELNode>,
};

type OELProps = { list: Array<*>, component: () => React$Node };

// This doesn't look consistent within the code
type OELState = { list: OELNode | Array<OELNode> };

export class OldEternalList extends Component<OELProps, OELState> {
  static propTypes = {
    list: PropTypes.array,
    component: PropTypes.func,
  };

  state = {
    list: [],
  };

  listItemHeightShouldUpdate: boolean = true;
  listItemHeight: number = -1;
  minimumStackSize: number = 10;
  scrollTop: number = 0;
  containerHeight: number = window.innerHeight;
  componentSign: ?Date;
  totalTop: number = -1;
  list: ?OELNode;
  renderedContainerCount: number = 0;
  renderedComponentCount: number = 0;

  // This is being invoked before the component is rendered, I think
  UNSAFE_componentWillReceiveProps(props: OELProps) {
    this.updateeternalList(props);
  }

  updateeternalList = (props?: OELProps) => {
    if (!props) {
      props = this.props;
    }
    let shoudUpdate = this.isComponentUpdated(props);
    shoudUpdate = this.setList(props) || shoudUpdate;
    if (shoudUpdate) {
      this.updateListDimension();
      this.updateListVisibility();
    }
  };

  componentDidMount() {
    if (containerRef.current) {
      this.containerHeight = parseInt(containerRef.current.clientHeight, 10);
      this.updateListItemHeight();
      this.updateeternalList();
    }
  }

  // This checks to see if the size of the list item might have changed
  isComponentUpdated = (props: OELProps) => {
    if (!this.componentSign || this.componentSign !== props.component.sign) {
      props.component.sign = Date.now();
      this.componentSign = props.component.sign;
      this.listItemHeightShouldUpdate = true;
      return true;
    }
    return false;
  };

  updateNodeDimension = (node: OELNode) => {
    if (node.parent && node.data) {
      node.height = 0;
      let temp;
      for (let idx = 0; idx < node.data.length; idx++) {
        temp = this.updateNodeDimension(node.data[idx]);
        node.height += temp.height;
      }
      node.top = node.data[0] ? node.data[0].top : 0;
      node.bottom = node.top + node.height;
    } else {
      node.height = (node.data || []).length * this.listItemHeight;
      node.top = this.totalTop;
      node.bottom = node.top + node.height;
      this.totalTop += node.height;
    }
    return node;
  };

  updateListDimension = () => {
    this.totalTop = 0;
    if (this.list) {
      this.updateNodeDimension(this.list);
    }
  };

  isNodeVisible = (node: OELNode): boolean => {
    return (
      node.top !== undefined &&
      node.bottom !== undefined &&
      node.top <= this.scrollTop + this.containerHeight * 1.5 &&
      node.bottom - this.containerHeight * -0.5 >= this.scrollTop
    );
  };

  updateNodeVisibility = (node: OELNode) => {
    node.visible = this.isNodeVisible(node);
    if (node.visible && node.parent && node.data) {
      for (let idx = 0; idx < node.data.length; idx++) {
        this.updateNodeVisibility(node.data[idx]);
      }
    }
  };

  // This appears to read the height for list items from a dummy list element.
  // I like that you don't have to specify the element height, but this seems
  // at least iffy, and honestly, somewhat problematic.
  updateListItemHeight = () => {
    if (this.listItemHeightShouldUpdate === true) {
      this.listItemHeight = 32;
      this.component = this.props.component;
      this.listItemHeightShouldUpdate = false;
      return true;
    }
    return false;
  };

  updateListVisibility = () => {
    let time: number = window.performance.now();
    this.updateNodeVisibility(this.list);
    this.visibilityCheckTime = window.performance.now() - time;
    this.setState({ list: this.list || [] }, () => {
      if (this.props.onUpdate) {
        this.props.onUpdate({
          renderedComponentCount: this.renderedComponentCount,
          renderedContainerCount: this.renderedContainerCount,
          renderedDivCount:
            this.renderedContainerCount + this.renderedComponentCount,
          visibilityCheckTime: this.visibilityCheckTime,
        });
      }
      if (this.updateListItemHeight()) {
        this.updateListDimension();
        this.updateListVisibility();
      }
    });
  };

  setList = (props = this.props) => {
    if (!this.list || this.list.sign !== props.list.sign) {
      this.list = props.list || [];
      this.list = this.recursiveSplit(this.list);
      this.list.sign = props.list.sign = Date.now();
      containerRef.current.scrollTop = 0;
      return true;
    }
    return false;
  };

  // Create's a binary tree of data until you get down to 10 elements.
  // Being a performance-focused engineer, I dislike that 10 is hard-coded,
  // with no explanation.
  // Is 10 the right number? I have no idea. Profile!
  recursiveSplit = (data: Array<OELNode>) => {
    if (data.length / 2 > this.minimumStackSize) {
      let mid = Math.floor(data.length / 2, 10);
      let node = {
        parent: true,
        getParent: () => data,
        data: [
          this.recursiveSplit(data.slice(0, mid)),
          this.recursiveSplit(data.slice(mid, data.length + 1)),
        ],
      };
      return node;
    }
    return {
      parent: false,
      data,
    };
  };

  // Lame helper to support an empty list? Not completely sure...
  getList = (): OELNode => this.state.list || {};

  // This returns the binary tree of visible portions of the list,
  // but I haven't spent any time to understand what it's doing yet.
  renderList = (node: ?OELNode) => {
    node = node || this.getList();
    const data: Array<OELNode> = node.data || [];
    if (node.parent) {
      this.renderedContainerCount += data.length;
      return data.map((item: OELNode, index: number) => (
        <div className="ilParent" key={index} style={{ height: item.height }}>
          {item.visible ? this.renderList(item) : ''}
        </div>
      ));
    } else {
      this.renderedComponentCount += data.length;
      return data.map((item, index) => this.component(item, index));
    }
  };

  handleScroll = (e) => {
    this.scrollTop = e.target.scrollTop;
    clearTimeout(this.updationDebounce);
    if (!this.updationInterval) {
      this.updationInterval = setInterval(() => {
        this.updateListVisibility();
      }, this.props.updateRate || 100);
    }
    this.updationDebounce = setTimeout(() => {
      this.updateListVisibility();
      clearInterval(this.updationInterval);
      this.updationInterval = null;
    }, this.props.updateRate || 100);
  };

  render() {
    this.renderedComponentCount = 0;
    this.renderedContainerCount = 0;
    let renderedList = this.renderList();

    return (
      <div
        className="eternalList"
        onScroll={this.handleScroll}
        ref={containerRef}
      >
        {renderedList}Î
      </div>
    );
  }
}
