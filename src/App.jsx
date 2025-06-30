import React, { useState } from 'react';
import * as XLSX from 'xlsx';

export default function YouTubeScraper() {
  const [videoUrl, setVideoUrl] = useState('');
  const [commentRange, setCommentRange] = useState('0-500');
  const [order, setOrder] = useState('time');
  const [xlsxContent, setXlsxContent] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async () => {
    if (!videoUrl.trim()) {
      setFeedback('⚠️ Please enter a valid YouTube video link.');
      return;
    }

    setFeedback('⏳ Scraper is running...');
    setIsRunning(true);

    const videoIdMatch = videoUrl.match(/(?:v=|shorts\/|youtu\.be\/)([\w-]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : '';
    const API_KEY = 'AIzaSyBFT3AmOVlQWrt2mRxFZozxirIrpcFdbjI';
    const maxResults = parseInt(commentRange.split('-')[1], 10);
    let comments = [];
    let nextPageToken = '';

    try {
      while (comments.length < maxResults) {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet,replies&videoId=${videoId}&maxResults=100&pageToken=${nextPageToken}&order=${order}&key=${API_KEY}`
        );
        const data = await response.json();

        if (!data.items || data.items.length === 0) break;

        for (const item of data.items) {
          const top = item.snippet.topLevelComment.snippet;

          comments.push({
            Author: top.authorDisplayName,
            Message: top.textDisplay.replace(/<[^>]+>/g, ''),
            'Published At': top.publishedAt,
            'Like Count': top.likeCount,
            'Is Reply': false
          });

          // Include replies if available
          if (item.replies && item.replies.comments) {
            item.replies.comments.forEach(reply => {
              const r = reply.snippet;
              comments.push({
                Author: r.authorDisplayName,
                Message: `↳ ${r.textDisplay.replace(/<[^>]+>/g, '')}`,
                'Published At': r.publishedAt,
                'Like Count': r.likeCount,
                'Is Reply': true
              });
            });
          }
        }

        if (!data.nextPageToken || comments.length >= maxResults) break;
        nextPageToken = data.nextPageToken;
      }

      // Generate Excel
      const worksheet = XLSX.utils.json_to_sheet(comments);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Comments');

      const blob = new Blob(
        [XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })],
        { type: 'application/octet-stream' }
      );
      const url = URL.createObjectURL(blob);
      setXlsxContent(url);
      setFeedback(`✅ Scraping completed. Total comments (incl. replies): ${comments.length}`);
    } catch (error) {
      console.error(error);
      setFeedback('❌ Something went wrong while scraping.');
    }

    setIsRunning(false);
  };

  const handleVideoUrlChange = (e) => {
    setVideoUrl(e.target.value);
    setXlsxContent('');
    setFeedback('');
  };

  return (
    <div className="flex flex-col gap-6 p-10 mx-auto bg-white w-screen shadow-2xl border border-gray-200 min-h-screen justify-center">
      <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8">📥 YouTube Comment Scraper</h1>

      <input 
        type="text" 
        placeholder="Paste YouTube video or Shorts link here..." 
        value={videoUrl} 
        onChange={handleVideoUrlChange} 
        className="border border-gray-300 p-4 rounded-2xl w-full focus:outline-none focus:border-blue-500 transition text-lg text-black" 
        required
      />

      {feedback && <div className="text-center text-lg font-medium text-gray-700">{feedback}</div>}

      <div className="flex flex-col sm:flex-row gap-6">
        <select 
          value={commentRange} 
          onChange={(e) => setCommentRange(e.target.value)} 
          className="border border-gray-300 p-4 rounded-2xl w-full focus:outline-none focus:border-blue-500 transition text-lg text-black"
        >
          <option value="0-500">0-500</option>
          <option value="500-1000">500-1000</option>
          <option value="1000-3000">1000-3000</option>
          <option value="3000-5000">3000-5000</option>
        </select>

        <select 
          value={order} 
          onChange={(e) => setOrder(e.target.value)} 
          className="border border-gray-300 p-4 rounded-2xl w-full focus:outline-none focus:border-blue-500 transition text-lg text-black"
        >
          <option value="relevance">Relevance</option>
          <option value="time">Newest</option>
        </select>
      </div>

      <button 
        style={{ backgroundColor: '#2563eb' }} 
        onClick={handleRun} 
        className="bg-blue-600 text-white rounded-2xl p-4 text-lg hover:bg-blue-700 transition transform hover:scale-105"
        disabled={isRunning}
      >
        🚀 {isRunning ? 'Running...' : 'Run Scraper'}
      </button>

      {xlsxContent && (
        <a href={xlsxContent} download="comments_with_replies.xlsx" className="text-center">
          <button className="bg-green-600 text-white rounded-2xl p-4 text-lg w-full hover:bg-green-700 transition transform hover:scale-105">
            ⬇️ Download Excel
          </button>
        </a>
      )}
    </div>
  );
}
