import EditableEdge from './EditableEdge'; // Must exist
import PlaceholderEdge from './PlaceholderEdge'; // Optional

const edgeTypes = {
  editable: EditableEdge,         // Used for edges with inline controls
  placeholder: PlaceholderEdge,   // Optional dashed edges for visual branching
};

export default edgeTypes;
