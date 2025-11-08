/**
 * خدمة الكشف عن الموقع الجغرافي للمستخدم
 * تستخدم IP address لتحديد الدولة تلقائياً
 */

interface GeolocationData {
  country: string;
  countryCode: string;
  city?: string;
  ip?: string;
}

class GeolocationService {
  private cachedLocation: GeolocationData | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 ساعة

  /**
   * الحصول على الموقع الجغرافي للمستخدم
   * يستخدم عدة خدمات مجانية كبدائل
   */
  async getUserLocation(): Promise<GeolocationData | null> {
    try {
      // التحقق من الـ cache أولاً
      if (this.cachedLocation && Date.now() < this.cacheExpiry) {

        return this.cachedLocation;
      }

      // محاولة الحصول على الموقع من localStorage
      const savedLocation = this.getLocationFromStorage();
      if (savedLocation) {

        this.cachedLocation = savedLocation;
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;
        return savedLocation;
      }

      // محاولة استخدام ipapi.co (مجاني - 1000 طلب/يوم)
      let location = await this.fetchFromIpApi();
      
      // إذا فشل، محاولة ipify + ip-api.com
      if (!location) {

        location = await this.fetchFromIpify();
      }

      // إذا فشل، محاولة geojs.io
      if (!location) {

        location = await this.fetchFromGeoJS();
      }

      if (location) {
        // حفظ في الـ cache والـ localStorage
        this.cachedLocation = location;
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;
        this.saveLocationToStorage(location);

        return location;
      }

      return null;
    } catch (error) {

      return null;
    }
  }

  /**
   * جلب الموقع من ipapi.co
   */
  private async fetchFromIpApi(): Promise<GeolocationData | null> {
    try {

      const response = await fetch('https://ipapi.co/json/', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {

        throw new Error('Failed to fetch from ipapi.co');
      }

      const data = await response.json();

      if (data.country_name && data.country_code) {
        return {
          country: data.country_name,
          countryCode: data.country_code,
          city: data.city,
          ip: data.ip
        };
      }

      return null;
    } catch (error) {

      return null;
    }
  }

  /**
   * جلب الموقع من ipify + ip-api.com
   */
  private async fetchFromIpify(): Promise<GeolocationData | null> {
    try {

      // الحصول على IP من ipify
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const ip = ipData.ip;

      // الحصول على معلومات الموقع من ip-api.com
      const locationResponse = await fetch(`http://ip-api.com/json/${ip}`);
      const locationData = await locationResponse.json();

      if (locationData.status === 'success' && locationData.country && locationData.countryCode) {
        return {
          country: locationData.country,
          countryCode: locationData.countryCode,
          city: locationData.city,
          ip: ip
        };
      }

      return null;
    } catch (error) {

      return null;
    }
  }

  /**
   * جلب الموقع من geojs.io
   */
  private async fetchFromGeoJS(): Promise<GeolocationData | null> {
    try {
      const response = await fetch('https://get.geojs.io/v1/ip/country.json');
      const data = await response.json();

      if (data.country && data.country_code) {
        return {
          country: data.country,
          countryCode: data.country_code,
          city: undefined,
          ip: data.ip
        };
      }

      return null;
    } catch (error) {

      return null;
    }
  }

  /**
   * حفظ الموقع في localStorage
   */
  private saveLocationToStorage(location: GeolocationData): void {
    try {
      const data = {
        location,
        timestamp: Date.now()
      };
      localStorage.setItem('user_geolocation', JSON.stringify(data));
    } catch (error) {

    }
  }

  /**
   * جلب الموقع من localStorage
   */
  private getLocationFromStorage(): GeolocationData | null {
    try {
      const stored = localStorage.getItem('user_geolocation');
      if (!stored) return null;

      const data = JSON.parse(stored);
      const age = Date.now() - data.timestamp;

      // إذا كان عمر البيانات أقل من 24 ساعة
      if (age < this.CACHE_DURATION) {
        return data.location;
      }

      // البيانات قديمة، حذفها
      localStorage.removeItem('user_geolocation');
      return null;
    } catch (error) {

      return null;
    }
  }

  /**
   * مسح الـ cache
   */
  clearCache(): void {
    this.cachedLocation = null;
    this.cacheExpiry = 0;
    localStorage.removeItem('user_geolocation');

  }

  /**
   * تحويل اسم الدولة بالإنجليزية إلى العربية
   */
  translateCountryToArabic(englishName: string): string {
    const countryTranslations: Record<string, string> = {
      'Morocco': 'المغرب',
      'Egypt': 'مصر',
      'Saudi Arabia': 'السعودية',
      'United Arab Emirates': 'الإمارات',
      'Kuwait': 'الكويت',
      'Qatar': 'قطر',
      'Bahrain': 'البحرين',
      'Oman': 'عمان',
      'Jordan': 'الأردن',
      'Lebanon': 'لبنان',
      'Palestine': 'فلسطين',
      'Syria': 'سوريا',
      'Iraq': 'العراق',
      'Yemen': 'اليمن',
      'Libya': 'ليبيا',
      'Tunisia': 'تونس',
      'Algeria': 'الجزائر',
      'Sudan': 'السودان',
      'Somalia': 'الصومال',
      'Djibouti': 'جيبوتي',
      'Mauritania': 'موريتانيا',
      'Comoros': 'جزر القمر',
      'France': 'فرنسا',
      'Germany': 'ألمانيا',
      'Italy': 'إيطاليا',
      'Spain': 'إسبانيا',
      'United Kingdom': 'بريطانيا',
      'Belgium': 'بلجيكا',
      'Netherlands': 'هولندا',
      'Switzerland': 'سويسرا',
      'Austria': 'النمسا',
      'Sweden': 'السويد',
      'Norway': 'النرويج',
      'China': 'الصين',
      'Japan': 'اليابان',
      'South Korea': 'كوريا الجنوبية',
      'India': 'الهند',
      'Pakistan': 'باكستان',
      'Bangladesh': 'بنغلاديش',
      'Indonesia': 'إندونيسيا',
      'Malaysia': 'ماليزيا',
      'Thailand': 'تايلاند',
      'Vietnam': 'فيتنام',
      'Philippines': 'الفلبين',
      'Singapore': 'سنغافورة',
      'Turkey': 'تركيا',
      'Iran': 'إيران',
      'United States': 'الولايات المتحدة',
      'Canada': 'كندا',
      'Mexico': 'المكسيك',
      'Brazil': 'البرازيل',
      'Argentina': 'الأرجنتين',
      'Chile': 'تشيلي',
      'Colombia': 'كولومبيا',
      'South Africa': 'جنوب أفريقيا',
      'Nigeria': 'نيجيريا',
      'Kenya': 'كينيا',
      'Ethiopia': 'إثيوبيا',
      'Ghana': 'غانا',
      'Tanzania': 'تنزانيا',
      'Uganda': 'أوغندا',
      'Australia': 'أستراليا',
      'New Zealand': 'نيوزيلندا'
    };

    return countryTranslations[englishName] || englishName;
  }
}

// تصدير instance واحد
export const geolocationService = new GeolocationService();
export default geolocationService;
