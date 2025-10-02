export class ChatAPIService {
  async chatStream(query, isWebsiteScrap, conversationHistory = [], onMessage, onEnd, onError) {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const searchWithDocmentApiEnedpoint = `${API_BASE_URL}/chat`;
    const searchWithWebsiteApiEnedpoint = `${API_BASE_URL}/website-search`;
    const apiEndpoint = isWebsiteScrap ? searchWithWebsiteApiEnedpoint : searchWithDocmentApiEnedpoint;
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          conversation_history: conversationHistory
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = '';
      let isEndEventDetected = false;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        console.log('Current buffer:', buffer);
        
        // Process buffer for complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          
          console.log('Processing line:', trimmedLine);
          
          // Check for end event first
          if (trimmedLine.startsWith('event: end')) {
            isEndEventDetected = true;
            continue;
          }
          
          // Handle data lines
          if (trimmedLine.startsWith('data: ')) {
            const data = trimmedLine.substring(6); // Remove 'data: ' prefix
            
            // If we detected end event, this data should be JSON
            if (isEndEventDetected) {
              // Don't display JSON as message content
              console.log('End event JSON:', data);
              
              try {
                const finalData = JSON.parse(data);
                console.log('Parsed final data:', finalData);
                onEnd(finalData);
                return; // End of stream
              } catch (e) {
                console.warn('Could not parse end data:', data, e);
                onEnd({});
                return;
              }
            } else {
              // Regular message data - process as text content
              if (data && data !== '[DONE]' && !data.startsWith('{')) {
                console.log('Sending text chunk:', JSON.stringify(data));
                onMessage(data);
              }
            }
          }
        }
      }
      
      // If we reach here without finding end event, still call onEnd
      onEnd({});
      
    } catch (error) {
      console.error('Error in chat stream:', error);
      onError(error);
    }
  }
}