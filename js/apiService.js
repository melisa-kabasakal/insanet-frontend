// apiService.js - API istekleri için servis sınıf
/**
 * API Service for handling all API requests
 */
class ApiService {
    /**
     * Initialize API service
     * @param {string} baseUrl - Base URL for API requests
     */
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.token = localStorage.getItem('auth_token');
        this.init();
    }

    /**
     * Helper method for making authenticated API requests
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise<any>} API response
     */
    async fetchWithAuth(endpoint, options = {}) {
        try {
            // Token yoksa ve endpoint login değilse, istek yapmayı reddet
            if (!this.token && !endpoint.includes('/auth/login')) {
                throw new Error('Authentication required');
            }

            const headers = {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            };

            if (this.token) {
                headers.Authorization = `Bearer ${this.token}`;
            }

            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    // Token geçersiz veya yetkisiz erişim, çıkış yap
                    this.clearTokens();
                    if (!endpoint.includes('/auth/login')) {
                        window.location.href = '#/login';
                    }
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            return response;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

  init() {
    this.checkApiStatus();
  }

  async checkApiStatus() {
    try {
      // Health check yerine login endpoint'ini kullan
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'OPTIONS'
      });
      
      // Herhangi bir cevap geldiyse API çalışıyor demektir
      return true;
    } catch (error) {
      console.error('Backend connection error:', error);
      return false;
    }
  }

  async validateToken() {
    // Token yoksa direkt false dön
    if (!this.token) {
      return false;
    }
    return true;
  }



  // Auth endpoints
  async login(emailOrPhone, password) {
    try {
      const response = await this.fetchWithAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ emailOrPhone, password })
      });

      if (response && response.token) {
        this.setToken(response.token);
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async checkApiStatus() {
    try {
      // Health check yerine login endpoint'ini kullan
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'OPTIONS'
      });
      return response;
    } catch (error) {
      console.error('API status check error:', error);
      throw error;
    }
  }
     

  async forgotPassword(emailOrPhone) {
    try {
      const response = await this.fetchWithAuth('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ emailOrPhone })
      });
      return response;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    };
  };

  async resetPassword(token, newPassword, emailOrPhone) {
    try {
      const response = await this.fetchWithAuth('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword, emailOrPhone })
      });
      return response;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    };
  };

  // User profile methods
  async getUserProfile() {
    try {
      const response = await this.fetchWithAuth('/user/profile');
      return response;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  };

  async updateUserProfile(profileData) {
    try {
      const response = await this.fetchWithAuth('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
      return response;
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  };

  async updateUserPassword(currentPassword, newPassword) {
    try {
      const response = await this.fetchWithAuth('/user/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      return response;
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    };
  };

  // Notification methods
  async getNotifications() {
    try {
      const response = await this.fetchWithAuth('/notifications');
      return response;
    } catch (error) {
      console.error('Get notifications error:', error);
      throw error;
    }
  };

  async markNotificationAsRead(notificationId) {
    try {
      const response = await this.fetchWithAuth(`/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      return response;
    } catch (error) {
      console.error('Mark notification as read error:', error);
      throw error;
    }
  };

  async deleteNotification(notificationId) {
    try {
      await this.fetchWithAuth(`/notifications/${notificationId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Delete notification error:', error);
      throw error;
    }
  }

  // Token methods
  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }



  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  // Logout method
  async logout() {
    try {
      // Backend'e çıkış isteği gönder
      await this.fetchWithAuth('/auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Her durumda local storage'i temizle
      this.clearTokens();
      localStorage.removeItem('userInfo');
      localStorage.removeItem('token');
    }
  };

  async getDocument(documentType) {
    try {
      const response = await this.fetchWithAuth(`/profile/document/${documentType}`, {
        method: 'GET',
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('Document fetch error:', error);
      throw error;
    }
  };

  // File upload methods
  async uploadImage(file, type = 'product') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await this.fetchWithAuth('/files/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        body: formData
      });
      return response;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  }

  async deleteImage(imageId) {
    try {
      await this.fetchWithAuth(`/files/${imageId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Image delete error:', error);
      throw error;
    }
  }

  // Search and filter methods
  async search(query, filters = {}) {
    try {
      const params = new URLSearchParams({
        q: query,
        ...filters
      }).toString();
      const response = await this.fetchWithAuth(`/search?${params}`);
      return response;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  async getFilters() {
    try {
      const response = await this.fetchWithAuth('/filters');
      return response;
    } catch (error) {
      console.error('Get filters error:', error);
      throw error;
    }
  }

  // Product methods
  async getProducts(filters = {}) {
    try {
      const params = new URLSearchParams(filters).toString();
      const endpoint = `/products${params ? `?${params}` : ''}`;
      const response = await this.fetchWithAuth(endpoint);
      return response;
    } catch (error) {
      console.error('Get products error:', error);
      throw error;
    }
  };

  async createProduct(productData) {
    try {
      const response = await this.fetchWithAuth('/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });
      return response;
    } catch (error) {
      console.error('Create product error:', error);
      throw error;
    }
  };

  async updateProduct(productId, productData) {
    try {
      const response = await this.fetchWithAuth(`/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
      });
      return response;
    } catch (error) {
      console.error('Update product error:', error);
      throw error;
    }
  };

  async deleteProduct(productId) {
    try {
      const response = await this.fetchWithAuth(`/products/${productId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Delete product error:', error);
      throw error;
    }
  };

  async getProductCategories() {
    try {
      const response = await this.fetchWithAuth('/products/categories');
      return response;
    } catch (error) {
      console.error('Get product categories error:', error);
      throw error;
    }
  };

  async getProductsByCategory(categoryId) {
    try {
      const response = await this.fetchWithAuth(`/products/categories/${categoryId}`);
      return response;
    } catch (error) {
      console.error('Get products by category error:', error);
      throw error;
    }
  };


  // Auction methods
  async getAuctions(filters = {}) {
    try {
      const params = new URLSearchParams(filters).toString();
      const endpoint = `/auctions${params ? `?${params}` : ''}`;
      const response = await this.fetchWithAuth(endpoint);
      return response;
    } catch (error) {
      console.error('Get auctions error:', error);
      throw error;
    }
  };

  async getAuctionById(auctionId) {
    try {
      const response = await this.fetchWithAuth(`/auctions/${auctionId}`);
      return response;
    } catch (error) {
      console.error('Get auction error:', error);
      throw error;
    }
  };

  async createAuction(auctionData) {
    try {
      const response = await this.fetchWithAuth('/auctions', {
        method: 'POST',
        body: JSON.stringify(auctionData)
      });
      return response;
    } catch (error) {
      console.error('Create auction error:', error);
      throw error;
    }
  };

  async updateAuction(auctionId, auctionData) {
    try {
      const response = await this.fetchWithAuth(`/auctions/${auctionId}`, {
        method: 'PUT',
        body: JSON.stringify(auctionData)
      });
      return response;
    } catch (error) {
      console.error('Update auction error:', error);
      throw error;
    }
  };

  async deleteAuction(auctionId) {
    try {
      await this.fetchWithAuth(`/auctions/${auctionId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Delete auction error:', error);
      throw error;
    }
  };

  async deleteBid(auctionId, bidId) {
    try {
      await this.fetchWithAuth(`/auctions/${auctionId}/bids/${bidId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Delete bid error:', error);
      throw error;
    }
  };

  async placeBid(auctionId, bidData) {
    try {
      const response = await this.fetchWithAuth(`/auctions/${auctionId}/bids`, {
        method: 'POST',
        body: JSON.stringify(bidData)
      });
      return response;
    } catch (error) {
      console.error('Place bid error:', error);
      throw error;
    }
  };

  async updateBid(auctionId, bidId, bidData) {
    try {
      const response = await this.fetchWithAuth(`/auctions/${auctionId}/bids/${bidId}`, {
        method: 'PUT',
        body: JSON.stringify(bidData)
      });
      return response;
    } catch (error) {
      console.error('Update bid error:', error);
      throw error;
    }
    };

    /**
     * Get bids for a specific auction
     * @param {string} auctionId - ID of the auction
     * @returns {Promise<Array>} List of bids
     */
    async getAuctionBids(auctionId) {
        try {
            const response = await this.fetchWithAuth(`/auctions/${auctionId}/bids`);
            return response;
        } catch (error) {
            console.error('Get auction bids error:', error);
            throw error;
        }
    };

    /**
     * Authenticate user with email and password
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Promise<Object>} Authentication response with token
     */
    async login(email, password) {
        try {
            const response = await this.fetchWithAuth('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @param {string} userData.email - User's email
     * @param {string} userData.password - User's password
     * @param {string} userData.name - User's full name
     * @returns {Promise<Object>} Registration response
     */
    async register(userData) {
        try {
            const response = await this.fetchWithAuth('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
      return response;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  async logout() {
    this.clearTokens();
    return true;
  };

  // Company user management methods
  async getCompanyUsers() {
    try {
      if (!this.token) {
        throw new Error('Authentication required');
      }
      const response = await this.fetchWithAuth('/company/users');
      return response;
    } catch (error) {
      console.error('Get company users error:', error);
      throw error;
    }
};

    /**
     * Add example user to company users list
     * @param {Object} userInfo - User information
     * @returns {Promise<void>}
     * @private
     */
    async _addExampleUser(userInfo) {
        try {
            if (!userInfo.isOwner) {
                const exampleUser = {
                    id: 2,
                    name: 'Example User',
                    email: 'example@company.com',
                    position: 'Sales Representative',
                    roleType: 'editor',
                    permissions: {
                        users: false,
                        orders: true,
                        products: true,
                        messages: true,
                        reports: false
                    },
                    status: 'active',
                    addedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    isOwner: false
                };
                const companyUsers = JSON.parse(localStorage.getItem('companyUsers') || '[]');
                companyUsers.push(exampleUser);
                localStorage.setItem('companyUsers', JSON.stringify(companyUsers));
            }
            
            // Simulate API response delay
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error('Add example user error:', error);
            throw error;
        }
    }

    /**
     * Add a new company user
     * @param {Object} userData - User data to add
     * @returns {Promise<Object>} Response from the API
     */
    async addCompanyUser(userData) {
        try {
            if (!this.token) {
                throw new Error('Authentication required');
            }
            const response = await this.fetchWithAuth('/company/users', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            return response;
        } catch (error) {
            console.error('Add company user error:', error);
            throw error;
        }
    }

    /**
     * Update an existing company user
     * @param {string} userId - ID of the user to update
     * @param {Object} userData - Updated user data
     * @returns {Promise<Object>} Response from the API
     */
    async updateCompanyUser(userId, userData) {
        try {
            if (!this.token) {
                throw new Error('Authentication required');
            }
            const response = await this.fetchWithAuth(`/company/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
            return response;
            } catch (error) {
            console.error('Update company user error:', error);
            throw error;
        }
    }

    /**
     * Delete a company user
     * @param {string} userId - ID of the user to delete
     * @returns {Promise<Object>} Response from the API
     */
    async deleteCompanyUser(userId) {
        try {
            if (!this.token) {
                throw new Error('Authentication required');
            }
            const response = await this.fetchWithAuth(`/company/users/${userId}`, {
                method: 'DELETE'
            });
            return response;
        } catch (error) {
            console.error('Delete company user error:', error);
            throw error;
        }
    }

    /**
     * Request OTP for email or phone verification
     * @param {string} identifier - Email or phone number
     * @returns {Promise<Object>} Response from the server
     */
    async requestOTP(identifier) {
        try {
            const isEmail = identifier.includes('@');
            const response = await this.fetchWithAuth('/auth/request-otp', {
                method: 'POST',
                body: JSON.stringify(isEmail ? { email: identifier } : { phoneNumber: identifier })
            });
            return response;
        } catch (error) {
            console.error('Request OTP error:', error);
            throw error;
        }
    }

    /**
     * Verify OTP for email or phone
     * @param {string} identifier - Email or phone number
     * @param {string} otpCode - OTP code to verify
     * @returns {Promise<Object>} Response from the server
     */
    async verifyOTP(identifier, otpCode) {
        try {
            const isEmail = identifier.includes('@');
            const response = await this.fetchWithAuth('/auth/verify-otp', {
                method: 'POST',
                body: JSON.stringify(isEmail ? 
                    { email: identifier, otpCode } : 
                    { phoneNumber: identifier, otpCode })
            });
            return response;
        } catch (error) {
            console.error('Verify OTP error:', error);
            throw error;
        }
    };

    /**
     * Get products with optional filters
     * @param {Object} filters - Optional filters for products
     * @returns {Promise<Object>} Response containing products
     */
    async getProducts(filters = {}) {
        try {
            const queryString = new URLSearchParams(filters).toString();
            const response = await this.fetchWithAuth(`/products?${queryString}`);
            return response;
        } catch (error) {
            console.error('Get products error:', error);
            throw error;
        }
    };

    /**
     * Get auctions with optional filters
     * @param {Object} filters - Optional filters for auctions
     * @returns {Promise<Object>} Response containing auctions
     */
    async getAuctions(filters = {}) {
        try {
            const queryString = new URLSearchParams(filters).toString();
            const response = await this.fetchWithAuth(`/auctions?${queryString}`);
            return response;
        } catch (error) {
            console.error('Get auctions error:', error);
            throw error;
        }
    }
    
    async getAuctionById(id) {
        try {
            const response = await this.fetchWithAuth(`/auctions/${id}`);
            return response;
        } catch (error) {
            console.error('Get auction by ID error:', error);
            throw error;
        }
    };


    generateBidHistory(auction) {
        const bidCount = auction.bidCount || 0;
        const currentBid = parseFloat(auction.currentBid?.replace(/[^\d.]/g, '') || 0);
        const startingPrice = parseFloat(auction.startingPrice?.replace(/[^\d.]/g, '') || 0);
        const history = [];

        if (bidCount === 0) {
            return history;
        }

        const now = new Date();
        const startDate = new Date(auction.createdDate || now);

        // Add starting price as first bid
        history.push({
            amount: startingPrice,
            timestamp: startDate.toISOString(),
            bidder: "System",
            id: 0,
            isStartingPrice: true
        });

        if (bidCount === 1) {
            // Only add current bid if there's just one bid
            history.push({
                amount: currentBid,
                timestamp: now.toISOString(),
                bidder: `Bidder ${bidCount}`,
                id: bidCount
            });
            return history;
        }

        // Generate intermediate bids
        const timeStep = (now.getTime() - startDate.getTime()) / (bidCount + 1);
        const priceStep = (currentBid - startingPrice) / bidCount;

        for (let i = 1; i < bidCount; i++) {
            const bidTime = new Date(startDate.getTime() + timeStep * i);
            history.push({
                amount: startingPrice + priceStep * i,
                timestamp: bidTime.toISOString(),
                bidder: `Bidder ${i}`,
                id: i
            });
        }

        // Add current bid as last bid
        history.push({
            amount: currentBid,
            timestamp: now.toISOString(),
            bidder: `Bidder ${bidCount}`,
            id: bidCount
        });

        return history;
    }

    async getProductById(id) {
        try {
            const response = await this.fetchWithAuth(`/products/${id}`);
            if (!response) {
                return null;
            }
            
            // Fetch additional product details in parallel
            const [stock, deliveryTime, supplier, rating] = await Promise.all([
                this.getProductStock(id),
                this.getDeliveryTime(id),
                this.getSupplierName(response.supplier),
                this.getProductRating(id)
            ]);

            // Enhance product with additional details
            return {
                ...response,
                stock,
                deliveryTime,
                supplier,
                rating,
                hasTSE: response.tse
            };
        } catch (error) {
            console.error('Get product by ID error:', error);
            throw error;
        }
    }

    async getProductStock(id) {
        try {
            const response = await this.fetchWithAuth(`/products/${id}/stock`);
            return response;
        } catch (error) {
            console.error('Get product stock error:', error);
            throw error;
        }
    }

    async getDeliveryTime(id) {
        try {
            const response = await this.fetchWithAuth(`/products/${id}/delivery-time`);
            return response;
        } catch (error) {
            console.error('Get delivery time error:', error);
            throw error;
        }
    }

    async getSupplierName(supplierId) {
        try {
            const response = await this.fetchWithAuth(`/suppliers/${supplierId}`);
            return response.name;
        } catch (error) {
            console.error('Get supplier name error:', error);
            throw error;
        }
    }

    async getProductRating(id) {
        try {
            const response = await this.fetchWithAuth(`/products/${id}/rating`);
            return response;
        } catch (error) {
            console.error('Get product rating error:', error);
            throw error;
        }
    }
    async submitQuoteRequest(quoteData) {
        try {
            const response = await this.fetchWithAuth('/quotes', {
                method: 'POST',
                body: JSON.stringify(quoteData)
            });
            return response;
        } catch (error) {
            console.error('Error submitting quote request:', error);
            throw error;
        }
    }

    async getCategories() {
        try {
            const response = await this.fetchWithAuth('/categories');
            return response;
        } catch (error) {
            console.error('Get categories error:', error);
            throw error;
        }
    }
    async getSuppliers(filters = {}) {
        try {
            const queryString = new URLSearchParams(filters).toString();
            const response = await this.fetchWithAuth(`/suppliers?${queryString}`);
            return response;
        } catch (error) {
            console.error('Get suppliers error:', error);
            throw error;
        }
    }

    // Müteahhit işlemleri
    async getContractors(filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        return this.fetchWithAuth(`/contractors?${queryString}`);
    }

    // Lojistik firma işlemleri
    async getLogistics(filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        return this.fetchWithAuth(`/logistics?${queryString}`);
    }

    // Mevcut Kullanıcı Profilini Al
    async getUserProfile() {
        if (this.token) {
            try {
                console.log("Fetching user profile from API...");
                const profile = await this.fetchWithAuth('/profile');
                console.log('Backend profile response:', profile);
                return { ...profile, isLoggedIn: true };
            } catch (error) {
                console.error("Error fetching user profile from API:", error);
                this.logout();
                return { isLoggedIn: false };
            }
        }
        return { isLoggedIn: false };
    }

    async updateUserProfile(profileData) {
        if (!this.token) throw new Error("Authentication required");
        try {
            const updatedProfile = await this.fetchWithAuth('/profile', {
                method: 'PUT',
                body: profileData
            });
            localStorage.setItem('userInfo', JSON.stringify(updatedProfile));
            return updatedProfile;
        } catch (error) {
            console.error("Error updating user profile:", error);
            throw error;
        }
    }

    async uploadProfilePicture(file) {
        if (!this.token) throw new Error("Authentication required");
        const formData = new FormData();
        formData.append('profilePicture', file);

        try {
            const response = await this.fetchWithAuth('/profile/picture', {
                method: 'POST',
                body: formData
            });
            const currentProfile = JSON.parse(localStorage.getItem('userInfo') || '{}');
            currentProfile.profilePictureUrl = response.profilePictureUrl;
            localStorage.setItem('userInfo', JSON.stringify(currentProfile));
            return response;
        } catch (error) {
            console.error("Error uploading profile picture:", error);
            throw error;
        }
    }

    // Arama işlemleri
    async search(query, type = 'all') {
        return this.fetchWithAuth(`/search?q=${encodeURIComponent(query)}&type=${type}`);
    }


    async changePassword(currentPassword, newPassword) {
        try {
            const response = await this.fetchWithAuth('/auth/change-password', {
                method: 'POST',
                body: JSON.stringify({ currentPassword, newPassword })
            });
            return response;
        } catch (error) {
            console.error('Password change error:', error);
            throw error;
        }
    }

    async requestPasswordResetEmail(email) {
        try {
            console.log('Sending password reset email request for:', email);
            
            const response = await fetch(`${this.baseUrl}/api/auth/reset-password/email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            console.log('Password reset email response status:', response.status);
            
            // Response içeriğini text olarak al
            const text = await response.text();
            console.log('Password reset email response text:', text);
            
            // Eğer response boşsa veya JSON değilse
            if (!text) {
                throw new Error('Sunucudan yanıt alınamadı');
            }
            
            // Text'i JSON'a çevir
            const data = JSON.parse(text);
            
            if (!response.ok) {
                throw new Error(data.message || 'Email ile şifre sıfırlama başarısız');
            }

            return data;
        } catch (error) {
            console.error('Error requesting password reset email:', error);
            throw error;
        }
    }


    async requestPasswordResetSMS(phone) {
        try {
            console.log('Sending password reset SMS request for:', phone);
            
            const response = await fetch(`${this.baseUrl}/api/auth/reset-password/sms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ phone })
            });

            console.log('Password reset SMS response status:', response.status);
            
            // Response içeriğini text olarak al
            const text = await response.text();
            console.log('Password reset SMS response text:', text);
            
            // Eğer response boşsa veya JSON değilse
            if (!text) {
                throw new Error('Sunucudan yanıt alınamadı');
            }
            
            // Text'i JSON'a çevir
            const data = JSON.parse(text);
            
            if (!response.ok) {
                throw new Error(data.message || 'SMS ile şifre sıfırlama başarısız');
            }

            return data;
        } catch (error) {
            console.error('Error requesting password reset SMS:', error);
            throw error;
        }
    }

    async requestOTP(emailOrPhone) {
        try {
            const response = await this.fetchWithAuth('/auth/request-otp', {
                method: 'POST',
                body: JSON.stringify({ emailOrPhone })
            });
            return response;
        } catch (error) {
            console.error('OTP request error:', error);
            throw error;
        }
    }

    async login(emailOrPhone, password) {
        try {
            const response = await this.fetchWithAuth('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ emailOrPhone, password })
            });
            if (response.token) {
                this.setToken(response.token);
            }
            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Mesaj işlemleri için API fonksiyonları
    async getMessages(tab = 'inbox', search = '') {
        if (!this.token) throw new Error("Authentication required");
        
        try {
            // GERÇEK API ENTEGRASYONU:
            // return await this.fetchWithAuth(`/messages?tab=${tab}&search=${encodeURIComponent(search)}`);
            
            // ---- MOCK API YANITI (Geçici) ----
            console.log(`Fetching messages for tab: ${tab}, search: ${search}`);
            
            // Kullanıcı bilgilerini al
            const userInfo = await this.getUserProfile();
            const { userType } = userInfo;
            
            // Mock mesaj verisi 
            const mockInbox = [
                {
                    id: 1,
                    sender: { id: 101, name: "Ankara Tedarik Ltd.", type: "supplier" },
                    recipient: { id: userInfo.id, name: userInfo.companyName, type: userInfo.userType },
                    subject: "Çimento Fiyat Teklifi",
                    content: "Sayın yetkili,\n\nBaşvurunuz üzerine çimento ürünlerimizin fiyat listesini ekte bulabilirsiniz. Kampanyalı fiyatlarımız 30 gün geçerlidir.\n\nBilgilerinize sunarız.\n\nSaygılarımızla,\nAnkara Tedarik Ltd.",
                    date: "2023-07-15T10:30:00",
                    read: true,
                    attachments: [
                        { id: 1, name: "Çimento_Fiyat_Listesi_2023.pdf", size: "320KB", type: "application/pdf" }
                    ]
                },
                {
                    id: 2,
                    sender: { id: 102, name: "İstanbul Lojistik A.Ş.", type: "logistics" },
                    recipient: { id: userInfo.id, name: userInfo.companyName, type: userInfo.userType },
                    subject: "Taşıma Hizmeti Hakkında",
                    content: "Merhaba,\n\nFirmamız inşaat malzemeleri taşımacılığı konusunda 15 yıllık tecrübeye sahiptir. İstanbul-Ankara ve İstanbul-İzmir hatlarında düzenli seferlerimiz bulunmaktadır.\n\nDetaylı bilgi için iletişime geçebilirsiniz.\n\nİyi çalışmalar dileriz.",
                    date: "2023-07-16T14:20:00",
                    read: false,
                    attachments: []
                },
                {
                    id: 3,
                    sender: { id: 103, name: "İzmir Yapı Malzemeleri", type: "supplier" },
                    recipient: { id: userInfo.id, name: userInfo.companyName, type: userInfo.userType },
                    subject: "Demir Fiyat Listesi",
                    content: "Değerli Müşterimiz,\n\nTalep etmiş olduğunuz inşaat demiri fiyatlarımızı ekte bulabilirsiniz. 100 ton üzeri alımlarda %5 indirim sağlayabiliyoruz.\n\nSaygılarımızla,\nİzmir Yapı Malzemeleri",
                    date: "2023-07-17T09:15:00",
                    read: false,
                    attachments: [
                        { id: 2, name: "Demir_Fiyatları_Temmuz_2023.xlsx", size: "156KB", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
                    ]
                }
            ];
            
            const mockSent = [
                {
                    id: 101,
                    sender: { id: userInfo.id, name: userInfo.companyName, type: userInfo.userType },
                    recipient: { id: 201, name: "Ege Çimento San.", type: "supplier" },
                    subject: "Çimento Fiyat Teklifi İsteği",
                    content: "Merhaba,\n\nAnkara Etimesgut'taki inşaat projemiz için 2000 ton çimento alımı düşünüyoruz.\n\nEn güncel fiyat teklifinizi ve teslimat şartlarınızı paylaşabilir misiniz?\n\nTeşekkürler.",
                    date: "2023-07-14T16:45:00",
                    read: true,
                    attachments: []
                },
                {
                    id: 102,
                    sender: { id: userInfo.id, name: userInfo.companyName, type: userInfo.userType },
                    recipient: { id: 202, name: "Anadolu Nakliyat", type: "logistics" },
                    subject: "Malzeme Taşıma Talebi",
                    content: "Sayın yetkili,\n\nİzmir'den Ankara'ya 2 kamyon tuğla sevkiyatı için fiyat teklifinizi rica ediyoruz.\n\nYaklaşık 40 ton ağırlığında olacak ve 25 Temmuz tarihinde hazır olacaktır.\n\nİlginiz için teşekkürler.",
                    date: "2023-07-15T11:30:00",
                    read: true,
                    attachments: []
                }
            ];
            
            // Arama filtresi uygula (eğer varsa)
            const applySearch = (messages) => {
                if (!search) return messages;
                return messages.filter(msg => 
                    msg.subject.toLowerCase().includes(search.toLowerCase()) || 
                    msg.content.toLowerCase().includes(search.toLowerCase()) ||
                    msg.sender.name.toLowerCase().includes(search.toLowerCase()) ||
                    msg.recipient.name.toLowerCase().includes(search.toLowerCase())
                );
            };
            
            // İstenen sekmeye göre filtrele ve gecikme ekle
            await new Promise(resolve => setTimeout(resolve, 500)); // 500ms gecikme
            
            if (tab === 'inbox') {
                return applySearch(mockInbox);
            } else {
                return applySearch(mockSent);
            }
            // ---- MOCK API YANITI SONU ----
        } catch (error) {
            console.error("Error fetching messages:", error);
            throw error;
        }
    }
    async getMessage(messageId) {
        if (!this.token) throw new Error("Authentication required");
        
        try {
            const message = await this.fetchWithAuth(`/messages/${messageId}`);
            if (!message) {
                throw new Error("Message not found");
            }
            
            // If it's an unread inbox message, mark it as read
            if (!message.read && message.recipient.id === this.getUserId()) {
                await this.fetchWithAuth(`/messages/${messageId}/read`, {
                    method: 'PATCH'
                });
            }
            
            return message;
        } catch (error) {
            console.error(`Error fetching message ${messageId}:`, error);
            throw error;
        }
    }

    async sendMessage(messageData) {
        if (!this.token) throw new Error("Authentication required");
        
        try {
            if (messageData instanceof FormData) {
                return await this.fetchWithAuth('/messages', {
                    method: 'POST',
                    body: messageData
                });
            }
            
            return await this.fetchWithAuth('/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });
        } catch (error) {
            console.error("Error sending message:", error);
            throw error;
        }
    }

    async replyToMessage(messageId, replyData) {
        if (!this.token) throw new Error("Authentication required");
        
        try {
            if (replyData instanceof FormData) {
                replyData.append('parentMessageId', messageId);
                return await this.fetchWithAuth('/messages/reply', {
                    method: 'POST',
                    body: replyData
                });
            }
            
            return await this.fetchWithAuth('/messages/reply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({...replyData, parentMessageId: messageId})
            });
        } catch (error) {
            console.error("Error replying to message:", error);
            throw error;
        }
    };
    
    // Mesajı sil
    async deleteMessage(messageId) {
        if (!this.token) throw new Error("Authentication required");
        
        try {
            // GERÇEK API ENTEGRASYONU:
            // return await this.fetchWithAuth(`/messages/${messageId}`, {
            //     method: 'DELETE'
            // });
            
            // ---- MOCK API YANITI (Geçici) ----
            console.log(`Deleting message ${messageId}`);
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return { success: true, message: "Mesaj başarıyla silindi." };
            // ---- MOCK API YANITI SONU ----
        } catch (error) {
            console.error(`Error deleting message ${messageId}:`, error);
            throw error;
        }
    }
    
    // Okunmamış mesaj sayısını getir
    async getUnreadMessageCount() {
        if (!this.token) return 0;
        
        try {
            // GERÇEK API ENTEGRASYONU:
            // const response = await this.fetchWithAuth('/messages/unread/count');
            // return response.count;
            
            // ---- MOCK API YANITI (Geçici) ----
            const messages = await this.getMessages('inbox');
            const unreadCount = messages.filter(msg => !msg.read).length;
            return unreadCount;
            // ---- MOCK API YANITI SONU ----
        } catch (error) {
            console.error("Error fetching unread message count:", error);
            return 0; // Hata durumunda 0 döndür
        }
    }
    
    // Kullanıcı türüne göre mesajlaşılabilecek firmaları getir
    async getMessageRecipients(recipientType) {
        if (!this.token) throw new Error("Authentication required");
        
        try {
            // GERÇEK API ENTEGRASYONU:
            // return await this.fetchWithAuth(`/users?type=${recipientType}`);
            
            // ---- MOCK API YANITI (Geçici) ----
            console.log(`Fetching recipients of type: ${recipientType}`);
            
            // Gecikme ekle
            await new Promise(resolve => setTimeout(resolve, 400));
            
            // Kullanıcı türüne göre mock veriler
            const mockContractors = [
                { id: 201, name: "Yılmaz İnşaat A.Ş.", type: "contractor" },
                { id: 202, name: "Mega Yapı Ltd.", type: "contractor" },
                { id: 203, name: "Doğan İnşaat", type: "contractor" },
                { id: 204, name: "Anadolu İnşaat A.Ş.", type: "contractor" }
            ];
            
            const mockSuppliers = [
                { id: 301, name: "Ege Çimento San.", type: "supplier" },
                { id: 302, name: "Demir-Çelik A.Ş.", type: "supplier" },
                { id: 303, name: "Ankara Tedarik Ltd.", type: "supplier" },
                { id: 304, name: "İzmir Yapı Malzemeleri", type: "supplier" }
            ];
            
            const mockLogistics = [
                { id: 401, name: "Hızlı Taşıma Ltd.", type: "logistics" },
                { id: 402, name: "Anadolu Nakliyat", type: "logistics" },
                { id: 403, name: "İstanbul Lojistik A.Ş.", type: "logistics" },
                { id: 404, name: "Ekspres Kargo", type: "logistics" }
            ];
            
            switch (recipientType) {
                case 'contractor':
                    return mockContractors;
                case 'supplier':
                    return mockSuppliers;
                case 'logistics':
                    return mockLogistics;
                default:
                    return [];
            }
            // ---- MOCK API YANITI SONU ----
        } catch (error) {
            console.error(`Error fetching recipients of type ${recipientType}:`, error);
            throw error;
        }
    }
    
    async getOrders(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (filters.requestNumber) {
                queryParams.append('requestNumber', filters.requestNumber);
            }
            if (filters.status) {
                queryParams.append('status', filters.status);
            }
            if (filters.startDate) {
                queryParams.append('startDate', filters.startDate);
            }
            if (filters.endDate) {
                queryParams.append('endDate', filters.endDate);
            }

            const response = await this.fetchWithAuth(`/orders?${queryParams}`);
            return response;
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }
    }

    async getOrderDetails(requestNumber) {
        try {
            const response = await this.fetchWithAuth(`/orders/${requestNumber}`);
            return response;
        } catch (error) {
            console.error('Error fetching order details:', error);
            throw error;
        }
    }

    async uploadFile(formData, progressCallback) {
        if (!this.token) throw new Error("Authentication required");
        
        try {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', `${this.apiUrl}/upload`, true);
                xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
                
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable && typeof progressCallback === 'function') {
                        const progress = Math.round((event.loaded / event.total) * 100);
                        progressCallback(progress);
                    }
                };
                
                xhr.onload = function() {
                    if (this.status === 200) {
                        resolve(JSON.parse(xhr.response));
                    } else {
                        reject({
                            status: this.status,
                            statusText: xhr.statusText,
                            response: xhr.response
                        });
                    }
                };
                
                xhr.send(formData);
            });
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }
    
    // Dosya indirme API fonksiyonu
    async downloadFile(fileId, fileName) {
        if (!this.token) throw new Error("Authentication required");
        
        try {
            // GERÇEK API ENTEGRASYONU:
            // const response = await fetch(`${this.apiUrl}/download/${fileId}`, {
            //     method: 'GET',
            //     headers: {
            //         'Authorization': `Bearer ${this.token}`
            //     }
            // });
            
            // if (!response.ok) {
            //     throw new Error(`Dosya indirme hatası: ${response.status} ${response.statusText}`);
            // }
            
            // const blob = await response.blob();
            // const url = URL.createObjectURL(blob);
            // const a = document.createElement('a');
            // a.href = url;
            // a.download = fileName || `download-${fileId}`;
            // document.body.appendChild(a);
            // a.click();
            // document.body.removeChild(a);
            // URL.revokeObjectURL(url);
            
            // ---- MOCK API YANITI (Geçici) ----
            console.log(`Mock downloading file with ID: ${fileId}, filename: ${fileName}`);
            
            // Dosya indirme simülasyonu - gerçek uygulamada yukarıdaki kod çalışacak
            alert(`Dosya indirme simülasyonu: ${fileName || fileId}`);
            
            return {
                success: true,
                message: "Dosya indirme işlemi başlatıldı"
            };
            // ---- MOCK API YANITI SONU ----
        } catch (error) {
            console.error("Error downloading file:", error);
            throw error;
        }
    }
    
    // Dosya silme API fonksiyonu
    async deleteFile(fileId) {
        if (!this.token) throw new Error("Authentication required");
        
        try {
            // GERÇEK API ENTEGRASYONU:
            // return await this.fetchWithAuth(`/files/${fileId}`, {
            //     method: 'DELETE'
            // });
            
            // ---- MOCK API YANITI (Geçici) ----
            console.log(`Mock deleting file with ID: ${fileId}`);
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return {
                success: true,
                message: "Dosya başarıyla silindi"
            };
            // ---- MOCK API YANITI SONU ----
        } catch (error) {
            console.error("Error deleting file:", error);
            throw error;
        }
    }

    // İhale Oluşturma API
    async createAuction(auctionData) {
        try {
            const response = await this.fetchWithAuth('/auctions', {
                method: 'POST',
                body: JSON.stringify(auctionData)
            });
            return response;
        } catch (error) {
            console.error('Create auction error:', error);
            throw error;
        }
    }
    
    // İhale başlangıç fiyatını hesapla (mock)
    calculateStartingPrice(materials) {
        // Örnek bir hesaplama, gerçekte farklı bir mantık kullanılabilir
        if (!materials || materials.length === 0) return 0;
        
        // Malzemelerin miktarına göre ortalama bir değer belirle
        let totalEstimate = 0;
        materials.forEach(material => {
            const quantity = parseFloat(material.quantity) || 0;
            
            // Birime göre farklı çarpanlar kullan
            let unitFactor = 100;
            switch (material.unit) {
                case 'Ton':
                    unitFactor = 1000;
                    break;
                case 'Kg':
                    unitFactor = 50;
                    break;
                case 'm²':
                    unitFactor = 200;
                    break;
                case 'm³':
                    unitFactor = 500;
                    break;
                case 'Metre':
                    unitFactor = 30;
                    break;
                case 'Adet':
                default:
                    unitFactor = 100;
            }
            
            totalEstimate += quantity * unitFactor;
        });
        
        // Minimum bir değer belirle
        return Math.max(totalEstimate, 1000);
    }
    
    // İhale ana lokasyonunu çıkar (en çok tekrar eden)
    extractMainLocation(materials) {
        if (!materials || materials.length === 0) return 'Belirtilmemiş';
        
        // Lokasyonları say
        const locationCounts = {};
        materials.forEach(material => {
            if (material.location) {
                locationCounts[material.location] = (locationCounts[material.location] || 0) + 1;
            }
        });
        
        // En çok tekrar eden lokasyonu bul
        let maxCount = 0;
        let mainLocation = 'Belirtilmemiş';
        
        for (const location in locationCounts) {
            if (locationCounts[location] > maxCount) {
                maxCount = locationCounts[location];
                mainLocation = location;
            }
        }
        
        return mainLocation;
    }

    async createOrder(orderData) {
        try {
            const response = await this.fetchWithAuth('/orders', {
                method: 'POST',
                body: JSON.stringify(orderData)
            });
            return response;
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    }

    // Bid related methods
    async getBidsForAuction(auctionId, page = 0, size = 10, sortBy = 'amount', direction = 'DESC') {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
                sortBy,
                direction
            });
            const response = await this.fetchWithAuth(`/auctions/${auctionId}/bids?${params}`);
            return response;
        } catch (error) {
            console.error('Bids fetch error:', error);
            throw error;
        }
    }

    async getHighestBidAmount(auctionId) {
        try {
            const response = await this.fetchWithAuth(`/auctions/${auctionId}/bids/highest`);
            return response;
        } catch (error) {
            console.error('Highest bid fetch error:', error);
            throw error;
        }
    }

    async getWinningBid(auctionId) {
        try {
            const response = await this.fetchWithAuth(`/auctions/${auctionId}/bids/winning`);
            return response;
        } catch (error) {
            console.error('Winning bid fetch error:', error);
            throw error;
        }
    }

    // Material request methods
    async createMaterialRequest(materialRequest) {
        try {
            const response = await this.fetchWithAuth('/material-requests/create', {
                method: 'POST',
                body: JSON.stringify(materialRequest)
            });
            return response;
        } catch (error) {
            console.error('Material request creation error:', error);
            throw error;
        }
    }

    async getMaterialRequestsByBid(bidId) {
        try {
            const response = await this.fetchWithAuth(`/material-requests/bid/${bidId}`);
            return response;
        } catch (error) {
            console.error('Material requests fetch error:', error);
            throw error;
        }
    }

    async updateMaterialRequestStatus(requestId, status) {
        try {
            const response = await this.fetchWithAuth(`/material-requests/${requestId}/status?status=${status}`, {
                method: 'PATCH'
            });
            return response;
        } catch (error) {
            console.error('Material request status update error:', error);
            throw error;
        }
    }

    // Offer methods
    async createOffer(offer) {
        try {
            const response = await this.fetchWithAuth('/offers/create', {
                method: 'POST',
                body: JSON.stringify(offer)
            });
            return response;
        } catch (error) {
            console.error('Offer creation error:', error);
            throw error;
        }
    }

    async getOfferById(offerId) {
        try {
            const response = await this.fetchWithAuth(`/offers/${offerId}`);
            return response;
        } catch (error) {
            console.error('Offer fetch error:', error);
            throw error;
        }
    }

    async deleteOffer(offerId) {
        try {
            await this.fetchWithAuth(`/offers/${offerId}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Offer deletion error:', error);
            throw error;
        }
    }

    // Product methods
    async getAllProducts() {
        try {
            const response = await this.fetchWithAuth('/products');
            return response;
        } catch (error) {
            console.error('Products fetch error:', error);
            throw error;
        }
    }

    async createProduct(product) {
        try {
            const response = await this.fetchWithAuth('/products', {
                method: 'POST',
                body: JSON.stringify(product)
            });
            return response;
        } catch (error) {
            console.error('Product creation error:', error);
            throw error;
        }
    }

    async updateProduct(productId, product) {
        try {
            const response = await this.fetchWithAuth(`/products/${productId}`, {
                method: 'PUT',
                body: JSON.stringify(product)
            });
            return response;
        } catch (error) {
            console.error('Product update error:', error);
            throw error;
        }
    }

    async deleteProduct(productId) {
        try {
            await this.fetchWithAuth(`/products/${productId}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Product deletion error:', error);
            throw error;
        }
    }

    // Password reset methods
    async forgotPassword(emailOrPhone) {
        try {
            const response = await this.fetchWithAuth('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ emailOrPhone })
            });
            return response;
        } catch (error) {
            console.error('Forgot password error:', error);
            throw error;
}
        
return mainLocation;
}

async createOrder(orderData) {
    try {
        const response = await this.fetchWithAuth('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
        return response;
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
}

// Bid related methods
async getBidsForAuction(auctionId, page = 0, size = 10, sortBy = 'amount', direction = 'DESC') {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
            sortBy,
            direction
        });
        const response = await this.fetchWithAuth(`/auctions/${auctionId}/bids?${params}`);
        return response;
    } catch (error) {
        console.error('Bids fetch error:', error);
        throw error;
    }
}

// Auction methods
async getAuctions(filters = {}) {
    try {
        const params = new URLSearchParams(filters).toString();
        const endpoint = `/auctions${params ? `?${params}` : ''}`;
        const response = await this.fetchWithAuth(endpoint);
        return response;
    } catch (error) {
        console.error('Get auctions error:', error);
        throw error;
    }
}

async getAuctionById(auctionId) {
    try {
        const response = await this.fetchWithAuth(`/auctions/${auctionId}`);
        return response;
    } catch (error) {
        console.error('Get auction error:', error);
        throw error;
    }
}

async createAuction(auctionData) {
    try {
        const response = await this.fetchWithAuth('/auctions', {
            method: 'POST',
            body: JSON.stringify(auctionData)
        });
        return response;
    } catch (error) {
        console.error('Create auction error:', error);
        throw error;
    }
}

async updateAuction(auctionId, auctionData) {
    try {
        const response = await this.fetchWithAuth(`/auctions/${auctionId}`, {
            method: 'PUT',
            body: JSON.stringify(auctionData)
        });
        return response;
    } catch (error) {
        console.error('Update auction error:', error);
        throw error;
    }
}

async deleteAuction(auctionId) {
    try {
        const response = await this.fetchWithAuth(`/auctions/${auctionId}`, {
            method: 'DELETE'
        });
        return response;
    } catch (error) {
        console.error('Delete auction error:', error);
        throw error;
    }
}

// Bid methods
async createBid(auctionId, bidData) {
    try {
        const response = await this.fetchWithAuth(`/auctions/${auctionId}/bids`, {
            method: 'POST',
            body: JSON.stringify(bidData)
        });
        return response;
    } catch (error) {
        console.error('Create bid error:', error);
        throw error;
    }
}

async getHighestBidAmount(auctionId) {
    try {
        const response = await this.fetchWithAuth(`/auctions/${auctionId}/bids/highest`);
        return response;
    } catch (error) {
        console.error('Highest bid fetch error:', error);
        throw error;
    }
}

async getWinningBid(auctionId) {
    try {
        const response = await this.fetchWithAuth(`/auctions/${auctionId}/bids/winning`);
        return response;
    } catch (error) {
        console.error('Winning bid fetch error:', error);
        throw error;
    }
}

// Product methods
async getProducts(filters = {}) {
    try {
        const params = new URLSearchParams(filters).toString();
        const endpoint = `/products${params ? `?${params}` : ''}`;
        const response = await this.fetchWithAuth(endpoint);
        return response;
    } catch (error) {
        console.error('Get products error:', error);
        throw error;
    }
}

async getProductById(productId) {
    try {
        const response = await this.fetchWithAuth(`/products/${productId}`);
        return response;
    } catch (error) {
        console.error('Get product error:', error);
        throw error;
    }
}

async createProduct(productData) {
    try {
        const response = await this.fetchWithAuth('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
        return response;
    } catch (error) {
        console.error('Create product error:', error);
        throw error;
    }
}

async updateProduct(productId, productData) {
    try {
        const response = await this.fetchWithAuth(`/products/${productId}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
        return response;
    } catch (error) {
        console.error('Update product error:', error);
        throw error;
    }
}

async deleteProduct(productId) {
    try {
        const response = await this.fetchWithAuth(`/products/${productId}`, {
            method: 'DELETE'
        });
        return response;
    } catch (error) {
        console.error('Delete product error:', error);
        throw error;
    }
}

// Material request methods
async createMaterialRequest(materialRequest) {
    try {
        const response = await this.fetchWithAuth('/material-requests/create', {
            method: 'POST',
            body: JSON.stringify(materialRequest)
        });
        return response;
    } catch (error) {
        console.error('Material request creation error:', error);
        throw error;
    }
}

async getMaterialRequestsByBid(bidId) {
    try {
        const response = await this.fetchWithAuth(`/material-requests/bid/${bidId}`);
        return response;
    } catch (error) {
        console.error('Material requests fetch error:', error);
        throw error;
    }
}

async updateMaterialRequestStatus(requestId, status) {
    try {
        const response = await this.fetchWithAuth(`/material-requests/${requestId}/status?status=${status}`, {
            method: 'PATCH'
        });
        return response;
    } catch (error) {
        console.error('Material request status update error:', error);
        throw error;
    }
}

// Offer methods
async createOffer(offer) {
    try {
        const response = await this.fetchWithAuth('/offers/create', {
            method: 'POST',
            body: JSON.stringify(offer)
        });
        return response;
    } catch (error) {
        console.error('Offer creation error:', error);
        throw error;
    }
}

async getOfferById(offerId) {
    try {
        const response = await this.fetchWithAuth(`/offers/${offerId}`);
        return response;
    } catch (error) {
        console.error('Offer fetch error:', error);
        throw error;
    }
}

async deleteOffer(offerId) {
    try {
        await this.fetchWithAuth(`/offers/${offerId}`, {
            method: 'DELETE'
        });
    } catch (error) {
        console.error('Offer deletion error:', error);
        throw error;
    }
}

// Product methods
async getAllProducts() {
    try {
        const response = await this.fetchWithAuth('/products');
        return response;
    } catch (error) {
        console.error('Products fetch error:', error);
        throw error;
    }
}

async createProduct(product) {
    try {
        const response = await this.fetchWithAuth('/products', {
            method: 'POST',
            body: JSON.stringify(product)
        });
        return response;
    } catch (error) {
        console.error('Product creation error:', error);
        throw error;
    }
}

async updateProduct(productId, product) {
    try {
        const response = await this.fetchWithAuth(`/products/${productId}`, {
            method: 'PUT',
            body: JSON.stringify(product)
        });
        return response;
    } catch (error) {
        console.error('Product update error:', error);
        throw error;
    }
}

async deleteProduct(productId) {
    try {
        await this.fetchWithAuth(`/products/${productId}`, {
            method: 'DELETE'
        });
    } catch (error) {
        console.error('Product deletion error:', error);
        throw error;
    }
}

// Password reset methods
async forgotPassword(emailOrPhone) {
    try {
        const response = await this.fetchWithAuth('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ emailOrPhone })
        });
        return response;
    } catch (error) {
        console.error('Forgot password error:', error);
        throw error;
    }
}

/**
 * Request OTP for password reset
 * @param {string} emailOrPhone - Email or phone to send OTP
 * @returns {Promise<Object>} OTP request confirmation
 */
async requestPasswordReset(emailOrPhone) {
    try {
        console.log('Requesting OTP for:', emailOrPhone);
        
        const response = await fetch(`${this.baseUrl}/auth/request-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ emailOrPhone: emailOrPhone })
        });

        console.log('Request OTP response status:', response.status);
        
        const text = await response.text();
        console.log('Request OTP response text:', text);
        
        if (!text) {
            throw new Error('Sunucudan yanıt alınamadı');
        }
        
        const data = JSON.parse(text);
        
        if (!response.ok) {
            throw new Error(data.message || 'OTP gönderme işlemi başarısız');
        }

        return data;
    } catch (error) {
        console.error('Request password reset error:', error);
        throw error;
    }
};

/**
 * Reset password with OTP verification
 * @param {string} emailOrPhone - Email or phone used for reset
 * @param {string} otpCode - OTP code received
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Reset confirmation
 */
async resetPassword(emailOrPhone, otpCode, newPassword) {
    try {
        console.log('Verifying OTP and resetting password for:', emailOrPhone);
            
        const response = await fetch(`${this.baseUrl}/auth/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                emailOrPhone: emailOrPhone,
                otpCode: otpCode,
                newPassword: CryptoJS.SHA256(newPassword).toString()
            })
        });

        console.log('Verify OTP response status:', response.status);
        
        const text = await response.text();
        console.log('Verify OTP response text:', text);
        
        if (!text) {
            throw new Error('Sunucudan yanıt alınamadı');
        }
        
        const data = JSON.parse(text);
        
        if (!response.ok) {
            throw new Error(data.message || 'Şifre sıfırlama başarısız');
        }

        return data;
    } catch (error) {
        console.error('Password reset error:', error);
        throw error;
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            };

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Şifre değiştirme başarısız');
            }

            return await response.json();
        } catch (error) {
            console.error('Change password error:', error);
            throw error;
        };

    /**
     * Get document by type
     * @param {string} documentType - Type of document to fetch
     * @returns {Promise<Blob>} Document as blob
     */
    async getDocument(documentType) {
        try {
            const response = await this.fetchWithAuth(`/profile/document/${documentType}`, {
                method: 'GET',
                responseType: 'blob'
            });
            return response;
        } catch (error) {
            console.error('Document fetch error:', error);
            throw error;
        }
    }

    /**
     * Ürün listesini getir
     * @returns {Promise<Array>} Ürün listesi
     */
    async getProducts() {
        try {
            const response = await this.fetchWithAuth('/products', {
                method: 'GET'
            });
            return response.products || [];
        } catch (error) {
            console.error('Ürün listesi alma hatası:', error);
            throw error;
        }
    }

    /**
     * Yeni ürün ekle
     * @param {Object} product - Ürün bilgileri
     * @returns {Promise<Object>} Oluşturulan ürün
     */
    async createProduct(product) {
        try {
            const response = await this.fetchWithAuth('/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(product)
            });
            return response;
        } catch (error) {
            console.error('Ürün oluşturma hatası:', error);
            throw error;
        }
    }

    /**
     * Ürün güncelle
     * @param {number} id - Ürün ID
     * @param {Object} product - Güncellenmiş ürün bilgileri
     * @returns {Promise<Object>} Güncellenmiş ürün
     */
    async updateProduct(id, product) {
        try {
            const response = await this.fetchWithAuth(`/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(product)
            });
            return response;
        } catch (error) {
            console.error('Ürün güncelleme hatası:', error);
            throw error;
        }
    }

    /**
     * Ürün sil
     * @param {number} id - Ürün ID
     * @returns {Promise<void>}
     */
    async deleteProduct(id) {
        try {
            await this.fetchWithAuth(`/products/${id}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Ürün silme hatası:', error);
            throw error;
        }
    }

    /**
     * Malzeme talebi oluştur
     * @param {Object} materialRequest - Malzeme talebi bilgileri
     * @returns {Promise<Object>} Oluşturulan malzeme talebi
     */
    async createMaterialRequest(materialRequest) {
        try {
            const response = await this.fetchWithAuth('/material-requests/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(materialRequest)
            });
            return response;
        } catch (error) {
            console.error('Malzeme talebi oluşturma hatası:', error);
            throw error;
        }
    }

    /**
     * Teklife ait malzeme taleplerini getir
     * @param {number} bidId - Teklif ID
     * @returns {Promise<Array>} Malzeme talepleri listesi
     */
    async getMaterialRequestsByBid(bidId) {
        try {
            const response = await this.fetchWithAuth(`/material-requests/bid/${bidId}`, {
                method: 'GET'
            });
            return response;
        } catch (error) {
            console.error('Malzeme talepleri getirme hatası:', error);
            throw error;
        }
    }

    /**
     * Malzeme talebi durumunu güncelle
     * @param {number} id - Malzeme talebi ID
     * @param {string} status - Yeni durum
     * @returns {Promise<Object>} Güncellenmiş malzeme talebi
     */
    async updateMaterialRequestStatus(id, status) {
        try {
            const response = await this.fetchWithAuth(`/material-requests/${id}/status?status=${status}`, {
                method: 'PATCH'
            });
            return response;
        } catch (error) {
            console.error('Malzeme talebi durum güncelleme hatası:', error);
            throw error;
        }
    }

    /**
     * Yeni talep numarası al (geçici olarak frontend'de oluşturuluyor)
     * @returns {Promise<string>} Talep numarası
     */
    async generateRequestNumber() {
        try {
            // Backend hazır olana kadar frontend'de oluştur
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hour = String(date.getHours()).padStart(2, '0');
            const minute = String(date.getMinutes()).padStart(2, '0');
            const second = String(date.getSeconds()).padStart(2, '0');
            const millisecond = String(date.getMilliseconds()).padStart(3, '0');
            
            // INS-YYYYMMDD-HHmmssSSS formatında benzersiz numara oluştur
            const requestNumber = `INS-${year}${month}${day}-${hour}${minute}${second}${millisecond}`;
            
            return requestNumber;
        } catch (error) {
            console.error('Talep numarası alma hatası:', error);
            throw error;
        }
    }
}

// Singleton instance oluştur ve global scope'a ekle
const apiService = new ApiService('http://localhost:8082/insanet');
window.apiService = apiService;