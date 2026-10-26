// Unique dish images from Unsplash for different Indian dishes
export const getDishImage = (dishName: string, index: number): string => {
  const dishImageMap: { [key: string]: string } = {
    // North Indian dishes
    'butter chicken': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop',
    'dal makhani': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
    'chicken tikka': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop',
    'tandoori chicken': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop',
    'naan': 'https://images.unsplash.com/photo-1574653853027-5d3ac9b9c7b8?w=400&h=300&fit=crop',
    'aloo gobi': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',
    'palak paneer': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop',
    'paneer butter masala': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    'chole bhature': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop',
    'rajma chawal': 'https://images.unsplash.com/photo-1563379091339-03246963d51a?w=400&h=300&fit=crop',
    
    // South Indian dishes
    'dosa': 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&h=300&fit=crop',
    'idli': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop',
    'sambar': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=300&fit=crop',
    'rasam': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop',
    'uttapam': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&h=300&fit=crop',
    'vada': 'https://images.unsplash.com/photo-1601050690117-94f5f6fa7cdf?w=400&h=300&fit=crop',
    'biryani': 'https://images.unsplash.com/photo-1563379091339-03246963d51a?w=400&h=300&fit=crop',
    
    // West Indian dishes
    'pav bhaji': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=300&fit=crop',
    'vada pav': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop',
    'dhokla': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&h=300&fit=crop',
    'thepla': 'https://images.unsplash.com/photo-1601050690117-94f5f6fa7cdf?w=400&h=300&fit=crop',
    'khandvi': 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&h=300&fit=crop',
    'undhiyu': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop',
    
    // East Indian dishes
    'fish curry': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    'rasgulla': 'https://images.unsplash.com/photo-1571167530149-c72f2dbf7c99?w=400&h=300&fit=crop',
    'sandesh': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    'mishti doi': 'https://images.unsplash.com/photo-1571167530149-c72f2dbf7c99?w=400&h=300&fit=crop',
    
    // Desserts
    'gulab jamun': 'https://images.unsplash.com/photo-1571167530149-c72f2dbf7c99?w=400&h=300&fit=crop',
    'kheer': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    'jalebi': 'https://images.unsplash.com/photo-1571167530149-c72f2dbf7c99?w=400&h=300&fit=crop',
    'laddu': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    'halwa': 'https://images.unsplash.com/photo-1571167530149-c72f2dbf7c99?w=400&h=300&fit=crop',
    
    // Snacks
    'samosa': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop',
    'pakora': 'https://images.unsplash.com/photo-1601050690117-94f5f6fa7cdf?w=400&h=300&fit=crop',
    'chaat': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=300&fit=crop',
    'bhel puri': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&h=300&fit=crop',
    'pani puri': 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&h=300&fit=crop',
  };

  // Try to find a specific image for the dish name
  const dishKey = dishName.toLowerCase();
  for (const [key, image] of Object.entries(dishImageMap)) {
    if (dishKey.includes(key) || key.includes(dishKey)) {
      return image;
    }
  }

  // Fallback to a variety of Indian food images
  const fallbackImages = [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1574653853027-5d3ac9b9c7b8?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1563379091339-03246963d51a?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1601050690117-94f5f6fa7cdf?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571167530149-c72f2dbf7c99?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
  ];

  return fallbackImages[index % fallbackImages.length];
};