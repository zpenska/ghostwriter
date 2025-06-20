import { collection, getDocs } from 'firebase/firestore';

interface Block {
  id: string;
  label: string;
}

export async function getBlocksAndTagsFromContent(content: string, db: any): Promise<{ blocks: Block[]; tags: string[] }> {
  try {
    // Get all blocks from Firestore
    const blocksRef = collection(db, 'blocks');
    const querySnapshot = await getDocs(blocksRef);
    
    const allBlocks: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.isActive !== false) {
        allBlocks.push({
          id: doc.id,
          name: data.name,
          tags: data.tags || []
        });
      }
    });

    // Find blocks referenced in content
    const foundBlocks: Block[] = [];
    const foundTags: string[] = [];

    allBlocks.forEach(block => {
      // Look for block references in content (like "📄 Medical Director Letterhead")
      if (content.includes(block.name)) {
        // Convert name to PascalCase for ID
        const pascalCaseId = block.name
          .replace(/[^\w\s]/g, '') // Remove special characters
          .replace(/\s+/g, ' ') // Normalize spaces
          .split(' ')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join('');

        foundBlocks.push({
          id: pascalCaseId,
          label: `📄 ${block.name}`
        });

        // Add tags from this block
        if (block.tags) {
          foundTags.push(...block.tags);
        }
      }
    });

    // Remove duplicate tags
    const uniqueTags = [...new Set(foundTags)];

    return { blocks: foundBlocks, tags: uniqueTags };
  } catch (error) {
    console.error('Error extracting blocks from content:', error);
    return { blocks: [], tags: [] };
  }
}