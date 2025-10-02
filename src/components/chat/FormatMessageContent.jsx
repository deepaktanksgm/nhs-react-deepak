const FormatMessageContent = (text) => {
  const formatInlineText = (text) => {
    let formattedText = text;
    // Handle markdown formatting
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    formattedText = formattedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
    return formattedText;
  };

  if (!text) return null;

  // Enhanced preprocessing for streaming data
  let processedText = text
    // Handle streaming data format - remove "data: " prefixes
    .replace(/^data:\s*/gm, '')
    // Remove event lines
    .replace(/^event:\s*.*/gm, '')
    // Clean up multiple spaces first
    .replace(/[ \t]+/g, ' ')
    .trim();

  // Critical: First ensure bullet points are properly separated by line breaks
  processedText = processedText
    // Insert line breaks before bullet points that aren't already on new lines
    .replace(/([.!?:])\s*•/g, '$1\n•')
    .replace(/([a-zA-Z])\s*•/g, '$1\n•')
    // Fix bullet points that got separated from their bold titles
    .replace(/•\s*\n\s*\*\*([^*]+)\*\*/g, '\n• **$1**')
    .replace(/•\s*\*\*([^*]+)\*\*/g, '\n• **$1**')
    // Handle cases where bold text is on separate line after bullet
    .replace(/•\s*\n\s*\*\*([^*]+)\*\*\s*\n\s*/g, '\n• **$1**: ')
    .replace(/•\s*\n\s*\*\*([^*]+)\*\*\s*([^*\n]*)/g, '\n• **$1**$2')
    // Fix standalone bold text that should be part of bullet point
    .replace(/\n\s*\*\*([^*]+)\*\*\s*\n/g, '\n• **$1**: ')
    // Ensure line breaks between different bullet points
    .replace(/(• [^•\n]+)([^•]*?)(•)/g, '$1$2\n$3')
    // Fix broken sentences within bullet points
    .replace(/(• [^•\n]*?)\n([a-z][^•]*?)(?=\n•|$)/g, '$1 $2')
    // Normalize spacing
    .replace(/•\s+/g, '• ')
    // Clean up other formatting
    .replace(/([.!?])([^\s\n•])/g, '$1 $2')
    .replace(/([a-zA-Z])\s*\n\s*([a-z][^•])/g, '$1 $2')
    // Clean up line breaks
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+|\n+$/g, '');

  // Split into logical sections, with better bullet point handling
  const sections = [];
  const lines = processedText.split('\n');
  let currentSection = '';
  let inList = false;
  let inBulletList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if this is a markdown heading
    if (line.match(/^#{1,6}\s+/)) {
      if (currentSection.trim()) {
        sections.push(currentSection.trim());
        currentSection = '';
      }
      currentSection = line + '\n';
      inList = false;
      inBulletList = false;
    }
    // Check if this is a bullet point (• or -)
    else if (line.match(/^[•-]\s+/)) {
      if (!inBulletList && currentSection.trim()) {
        sections.push(currentSection.trim());
        currentSection = '';
      }
      currentSection += line + '\n';
      inBulletList = true;
      inList = true;
    }
    // Check if this is a numbered list item
    else if (line.match(/^\d+\.\s+/) || (inList && !inBulletList && line && !line.match(/^#{1,6}\s+/) && !line.match(/^[•-]\s+/))) {
      if (inBulletList) {
        // End bullet list, start numbered list
        if (currentSection.trim()) {
          sections.push(currentSection.trim());
          currentSection = '';
        }
        inBulletList = false;
      } else if (!inList && currentSection.trim()) {
        sections.push(currentSection.trim());
        currentSection = '';
      }
      currentSection += line + '\n';
      inList = true;
    }
    // Empty line - potential section break
    else if (!line) {
      if (inList || inBulletList) {
        // End of list
        if (currentSection.trim()) {
          sections.push(currentSection.trim());
          currentSection = '';
        }
        inList = false;
        inBulletList = false;
      } else if (currentSection.trim()) {
        // Add empty line to current section for paragraph breaks
        currentSection += '\n';
      }
    }
    // Regular content line
    else {
      if ((inList || inBulletList) && !line.match(/^[•\d-]/) && !line.match(/^\s*\*\*/)) {
        // This might be continuation of a bullet point, check if it should be
        // End list and start new section
        if (currentSection.trim()) {
          sections.push(currentSection.trim());
          currentSection = '';
        }
        inList = false;
        inBulletList = false;
      }
      currentSection += line + '\n';
    }
  }

  // Add final section
  if (currentSection.trim()) {
    sections.push(currentSection.trim());
  }

  return sections.map((section, sIndex) => {
    const trimmedSection = section.trim();

    // Handle markdown headings (###, ##, #)
    const headingMatch = trimmedSection.match(/^(#{1,6})\s+(.+)$/m);
    if (headingMatch) {
      const [, hashes, title] = headingMatch;
      const level = hashes.length;
      const remainingContent = trimmedSection.replace(/^#{1,6}\s+.+$/m, '').trim();

      const HeadingTag = level <= 3 ? `h${level + 1}` : 'h4';
      const headingClass = level === 1 ? 'text-xl font-bold text-gray-900 mb-3' :
        level === 2 ? 'text-lg font-bold text-gray-900 mb-3' :
          'text-base font-bold text-gray-900 mb-2';

      return (
        <div key={sIndex} className="mb-4">
          {React.createElement(HeadingTag, {
            className: headingClass
          }, title)}
          {remainingContent && (
            <div className="text-gray-700 leading-relaxed">
              <span dangerouslySetInnerHTML={{ __html: formatInlineText(remainingContent) }} />
            </div>
          )}
        </div>
      );
    }

    // Handle bullet point sections - IMPROVED
    const bulletItems = trimmedSection.split('\n').filter(line => line.trim());
    const isAllBulletItems = bulletItems.every(line => line.match(/^[•-]\s+/));

    if (isAllBulletItems && bulletItems.length > 0) {
      return (
        <div key={sIndex} className="mb-4">
          {bulletItems.map((item, itemIndex) => {
            const content = item.replace(/^[•-]\s+/, '').trim();
            
            // Check if this bullet has a bold title with description
            const boldTitleMatch = content.match(/^\*\*([^*]+)\*\*:\s*(.*)/s);
            if (boldTitleMatch) {
              const [, title, description] = boldTitleMatch;
              return (
                <div key={`${sIndex}-${itemIndex}`} className="mb-3">
                  <div className="flex items-start">
                    <span className="text-blue-600 mr-3 flex-shrink-0 mt-0.5">•</span>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-1">{title}</div>
                      {description && description.trim() && (
                        <div className="text-gray-700 leading-relaxed">
                          <span dangerouslySetInnerHTML={{ __html: formatInlineText(description) }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // Regular bullet point
            return (
              <div key={`${sIndex}-${itemIndex}`} className="mb-2">
                <div className="flex items-start">
                  <span className="text-blue-600 mr-3 flex-shrink-0 mt-0.5">•</span>
                  <div className="flex-1 text-gray-700 leading-relaxed">
                    <span dangerouslySetInnerHTML={{ __html: formatInlineText(content) }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Handle single bullet point
    if (trimmedSection.match(/^[•-]\s+/)) {
      const content = trimmedSection.replace(/^[•-]\s+/, '');
      
      // Check if this bullet has a bold title with description
      const boldTitleMatch = content.match(/^\*\*([^*]+)\*\*:\s*(.*)/s);
      if (boldTitleMatch) {
        const [, title, description] = boldTitleMatch;
        return (
          <div key={sIndex} className="mb-3">
            <div className="flex items-start">
              <span className="text-blue-600 mr-3 flex-shrink-0 mt-0.5">•</span>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">{title}</div>
                {description && description.trim() && (
                  <div className="text-gray-700 leading-relaxed">
                    <span dangerouslySetInnerHTML={{ __html: formatInlineText(description) }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      // Regular single bullet point
      return (
        <div key={sIndex} className="mb-2">
          <div className="flex items-start">
            <span className="text-blue-600 mr-3 flex-shrink-0 mt-0.5">•</span>
            <div className="flex-1 text-gray-700 leading-relaxed">
              <span dangerouslySetInnerHTML={{ __html: formatInlineText(content) }} />
            </div>
          </div>
        </div>
      );
    }

    // Handle multiple numbered items in one section
    const numberedItems = trimmedSection.split(/(?=\d+\.\s*\*\*)/);
    if (numberedItems.length > 1) {
      return (
        <div key={sIndex} className="mb-4">
          {numberedItems.map((item, itemIndex) => {
            const trimmedItem = item.trim();
            if (!trimmedItem) return null;

            const numberedMatch = trimmedItem.match(/^(\d+)\.\s*\*\*([^*]+)\*\*:?\s*(.*)/s);
            if (numberedMatch) {
              const [, number, title, description] = numberedMatch;
              return (
                <div key={`${sIndex}-${itemIndex}`} className="mb-4">
                  <h4 className="font-bold text-gray-900 text-base mb-2 leading-tight">
                    {number}. {title}
                  </h4>
                  {description && description.trim() && (
                    <div className="text-gray-700 leading-relaxed ml-4">
                      <span dangerouslySetInnerHTML={{ __html: formatInlineText(description) }} />
                    </div>
                  )}
                </div>
              );
            }

            if (itemIndex === 0 && !trimmedItem.match(/^\d+\./)) {
              return (
                <div key={`${sIndex}-${itemIndex}`} className="mb-4 text-gray-800 leading-relaxed">
                  <span dangerouslySetInnerHTML={{ __html: formatInlineText(trimmedItem) }} />
                </div>
              );
            }

            return null;
          }).filter(Boolean)}
        </div>
      );
    }

    // Handle single numbered list items with bold titles
    const numberedBoldMatch = trimmedSection.match(/^(\d+)\.\s*\*\*([^*]+)\*\*:?\s*(.*)/s);
    if (numberedBoldMatch) {
      const [, number, title, description] = numberedBoldMatch;
      return (
        <div key={sIndex} className="mb-4">
          <h4 className="font-bold text-gray-900 text-base mb-2 leading-tight">
            {number}. {title}
          </h4>
          {description && description.trim() && (
            <div className="text-gray-700 leading-relaxed ml-4">
              <span dangerouslySetInnerHTML={{ __html: formatInlineText(description) }} />
            </div>
          )}
        </div>
      );
    }

    // Handle numbered list items without bold formatting
    const simpleNumberMatch = trimmedSection.match(/^(\d+)\.\s*(.*)/s);
    if (simpleNumberMatch) {
      const [, number, content] = simpleNumberMatch;

      const titleMatch = content.match(/^([^:.!?]+[:.!?])\s*(.*)/s);
      if (titleMatch) {
        const [, title, description] = titleMatch;
        return (
          <div key={sIndex} className="mb-4">
            <h4 className="font-bold text-gray-900 text-base mb-2 leading-tight">
              {number}. {title.replace(/[:.!?]$/, '')}
            </h4>
            {description && description.trim() && (
              <div className="text-gray-700 leading-relaxed ml-4">
                <span dangerouslySetInnerHTML={{ __html: formatInlineText(description) }} />
              </div>
            )}
          </div>
        );
      }

      return (
        <div key={sIndex} className="mb-3">
          <div className="flex items-start">
            <span className="font-semibold text-blue-600 mr-3 flex-shrink-0">
              {number}.
            </span>
            <div className="flex-1 text-gray-800 leading-relaxed">
              <span dangerouslySetInnerHTML={{ __html: formatInlineText(content) }} />
            </div>
          </div>
        </div>
      );
    }

    // Handle standalone bold headings with colons
    const boldHeadingMatch = trimmedSection.match(/^\*\*([^*]+)\*\*:?\s*(.*)/s);
    if (boldHeadingMatch) {
      const [, title, content] = boldHeadingMatch;
      return (
        <div key={sIndex} className="mb-4">
          <h4 className="font-semibold text-gray-900 text-base mb-2">
            {title}
          </h4>
          {content && content.trim() && (
            <div className="text-gray-700 leading-relaxed ml-4">
              <span dangerouslySetInnerHTML={{ __html: formatInlineText(content) }} />
            </div>
          )}
        </div>
      );
    }

    // Handle regular paragraphs
    return (
      <div key={sIndex} className="mb-4 text-gray-800 leading-relaxed">
        <span dangerouslySetInnerHTML={{ __html: formatInlineText(trimmedSection) }} />
      </div>
    );
  });
};

export default FormatMessageContent;