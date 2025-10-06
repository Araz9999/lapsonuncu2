import { USSDMenu, USSDMenuItem, USSDResponse } from '@/types/ussd';
import { Language } from '@/store/languageStore';

const ussdMenus: Record<string, USSDMenu> = {
  main: {
    id: 'main',
    title: {
      az: 'Əsas Menyu',
      ru: 'Главное меню',
      en: 'Main Menu',
    },
    items: [
      {
        id: 'balance',
        option: '1',
        label: {
          az: 'Balans yoxla',
          ru: 'Проверить баланс',
          en: 'Check balance',
        },
        type: 'action',
        action: async () => {
          return 'Sizin balansınız: 25.50 AZN';
        },
      },
      {
        id: 'services',
        option: '2',
        label: {
          az: 'Xidmətlər',
          ru: 'Услуги',
          en: 'Services',
        },
        type: 'menu',
        children: [
          {
            id: 'internet',
            option: '1',
            label: {
              az: 'İnternet paketləri',
              ru: 'Интернет пакеты',
              en: 'Internet packages',
            },
            type: 'menu',
            children: [
              {
                id: 'daily',
                option: '1',
                label: {
                  az: 'Günlük paketlər',
                  ru: 'Дневные пакеты',
                  en: 'Daily packages',
                },
                type: 'action',
                action: async () => {
                  return '1GB - 1 AZN\n2GB - 1.50 AZN\n5GB - 3 AZN\n\nAktivləşdirmək üçün paket nömrəsini daxil edin (1-3):';
                },
              },
              {
                id: 'weekly',
                option: '2',
                label: {
                  az: 'Həftəlik paketlər',
                  ru: 'Недельные пакеты',
                  en: 'Weekly packages',
                },
                type: 'action',
                action: async () => {
                  return '5GB - 5 AZN\n10GB - 8 AZN\n20GB - 12 AZN\n\nAktivləşdirmək üçün paket nömrəsini daxil edin (1-3):';
                },
              },
              {
                id: 'monthly',
                option: '3',
                label: {
                  az: 'Aylıq paketlər',
                  ru: 'Месячные пакеты',
                  en: 'Monthly packages',
                },
                type: 'action',
                action: async () => {
                  return '20GB - 15 AZN\n50GB - 25 AZN\n100GB - 40 AZN\nLimitsiz - 60 AZN\n\nAktivləşdirmək üçün paket nömrəsini daxil edin (1-4):';
                },
              },
            ],
          },
          {
            id: 'minutes',
            option: '2',
            label: {
              az: 'Dəqiqə paketləri',
              ru: 'Пакеты минут',
              en: 'Minute packages',
            },
            type: 'action',
            action: async () => {
              return '100 dəqiqə - 3 AZN\n300 dəqiqə - 7 AZN\n1000 dəqiqə - 15 AZN\n\nAktivləşdirmək üçün paket nömrəsini daxil edin (1-3):';
            },
          },
          {
            id: 'sms',
            option: '3',
            label: {
              az: 'SMS paketləri',
              ru: 'SMS пакеты',
              en: 'SMS packages',
            },
            type: 'action',
            action: async () => {
              return '50 SMS - 1 AZN\n100 SMS - 1.50 AZN\n500 SMS - 5 AZN\n\nAktivləşdirmək üçün paket nömrəsini daxil edin (1-3):';
            },
          },
        ],
      },
      {
        id: 'transfer',
        option: '3',
        label: {
          az: 'Balans köçürmə',
          ru: 'Перевод баланса',
          en: 'Balance transfer',
        },
        type: 'input',
        action: async (input?: string) => {
          if (!input) {
            return 'Nömrəni daxil edin (məs: 0501234567):';
          }
          return `${input} nömrəsinə köçürüləcək məbləği daxil edin:`;
        },
      },
      {
        id: 'tariff',
        option: '4',
        label: {
          az: 'Tarif məlumatı',
          ru: 'Информация о тарифе',
          en: 'Tariff information',
        },
        type: 'action',
        action: async () => {
          return 'Cari tarifınız: Premium\nAylıq ödəniş: 20 AZN\nDaxil olan:\n- 10GB internet\n- 500 dəqiqə\n- 100 SMS';
        },
      },
      {
        id: 'support',
        option: '5',
        label: {
          az: 'Dəstək',
          ru: 'Поддержка',
          en: 'Support',
        },
        type: 'menu',
        children: [
          {
            id: 'call',
            option: '1',
            label: {
              az: 'Operatorla əlaqə',
              ru: 'Связаться с оператором',
              en: 'Contact operator',
            },
            type: 'action',
            action: async () => {
              return 'Dəstək xətti: 111\nİş saatları: 09:00-18:00\nHər gün';
            },
          },
          {
            id: 'faq',
            option: '2',
            label: {
              az: 'Tez-tez verilən suallar',
              ru: 'Часто задаваемые вопросы',
              en: 'FAQ',
            },
            type: 'action',
            action: async () => {
              return '1. Balansı necə yoxlayım?\n2. İnternet paketi necə aktivləşdirim?\n3. Nömrəni necə dəyişim?\n\nSual nömrəsini seçin (1-3):';
            },
          },
        ],
      },
    ],
  },
};

export class USSDService {
  private currentMenuPath: string[] = [];
  private awaitingInput: boolean = false;
  private inputContext: { menuId: string; itemId: string } | null = null;

  async processUSSDCode(code: string, language: Language): Promise<USSDResponse> {
    console.log('[USSD] Processing code:', code);
    
    this.currentMenuPath = [];
    this.awaitingInput = false;
    this.inputContext = null;

    const mainMenu = ussdMenus.main;
    const menuText = this.formatMenu(mainMenu, language);

    return {
      text: menuText,
      isEnd: false,
      menuId: 'main',
    };
  }

  async processUSSDInput(
    input: string,
    currentPath: string[],
    language: Language
  ): Promise<USSDResponse> {
    console.log('[USSD] Processing input:', input, 'Path:', currentPath);

    if (this.awaitingInput && this.inputContext) {
      return await this.handleInputAction(input, language);
    }

    if (input === '0') {
      if (currentPath.length === 0) {
        return {
          text: language === 'az' 
            ? 'Sessiya başa çatdı' 
            : language === 'ru'
            ? 'Сессия завершена'
            : 'Session ended',
          isEnd: true,
        };
      }

      const newPath = currentPath.slice(0, -1);
      this.currentMenuPath = newPath;
      return await this.navigateToMenu(newPath, language);
    }

    const currentMenu = this.getMenuByPath(currentPath);
    if (!currentMenu) {
      return {
        text: language === 'az' 
          ? 'Xəta baş verdi. Yenidən cəhd edin.' 
          : language === 'ru'
          ? 'Произошла ошибка. Попробуйте снова.'
          : 'An error occurred. Please try again.',
        isEnd: true,
      };
    }

    const selectedItem = currentMenu.items.find((item) => item.option === input);
    if (!selectedItem) {
      const errorText = this.formatMenu(currentMenu, language);
      return {
        text: `${language === 'az' ? 'Yanlış seçim!' : language === 'ru' ? 'Неверный выбор!' : 'Invalid choice!'}\n\n${errorText}`,
        isEnd: false,
        menuId: currentMenu.id,
      };
    }

    if (selectedItem.type === 'menu' && selectedItem.children) {
      const newPath = [...currentPath, selectedItem.id];
      this.currentMenuPath = newPath;
      
      const submenu: USSDMenu = {
        id: selectedItem.id,
        title: selectedItem.label,
        items: selectedItem.children,
        parentId: currentMenu.id,
      };

      const menuText = this.formatMenu(submenu, language);
      return {
        text: menuText,
        isEnd: false,
        menuId: selectedItem.id,
      };
    }

    if (selectedItem.type === 'action' && selectedItem.action) {
      const result = await selectedItem.action();
      return {
        text: `${result}\n\n0 - ${language === 'az' ? 'Geri' : language === 'ru' ? 'Назад' : 'Back'}`,
        isEnd: false,
        menuId: currentMenu.id,
      };
    }

    if (selectedItem.type === 'input' && selectedItem.action) {
      this.awaitingInput = true;
      this.inputContext = { menuId: currentMenu.id, itemId: selectedItem.id };
      
      const result = await selectedItem.action();
      return {
        text: result,
        isEnd: false,
        requiresInput: true,
        menuId: currentMenu.id,
      };
    }

    return {
      text: language === 'az' 
        ? 'Əməliyyat tamamlandı' 
        : language === 'ru'
        ? 'Операция завершена'
        : 'Operation completed',
      isEnd: true,
    };
  }

  private async handleInputAction(input: string, language: Language): Promise<USSDResponse> {
    if (!this.inputContext) {
      return {
        text: language === 'az' 
          ? 'Xəta baş verdi' 
          : language === 'ru'
          ? 'Произошла ошибка'
          : 'An error occurred',
        isEnd: true,
      };
    }

    const menu = this.getMenuByPath(this.currentMenuPath);
    if (!menu) {
      return {
        text: language === 'az' 
          ? 'Xəta baş verdi' 
          : language === 'ru'
          ? 'Произошла ошибка'
          : 'An error occurred',
        isEnd: true,
      };
    }

    const item = menu.items.find((i) => i.id === this.inputContext!.itemId);
    if (item && item.action) {
      const result = await item.action(input);
      
      this.awaitingInput = false;
      this.inputContext = null;

      return {
        text: `${result}\n\n0 - ${language === 'az' ? 'Əsas menyuya qayıt' : language === 'ru' ? 'Вернуться в главное меню' : 'Back to main menu'}`,
        isEnd: false,
        menuId: menu.id,
      };
    }

    return {
      text: language === 'az' 
        ? 'Əməliyyat tamamlandı' 
        : language === 'ru'
        ? 'Операция завершена'
        : 'Operation completed',
      isEnd: true,
    };
  }

  private async navigateToMenu(path: string[], language: Language): Promise<USSDResponse> {
    const menu = this.getMenuByPath(path);
    if (!menu) {
      return {
        text: language === 'az' 
          ? 'Xəta baş verdi' 
          : language === 'ru'
          ? 'Произошла ошибка'
          : 'An error occurred',
        isEnd: true,
      };
    }

    const menuText = this.formatMenu(menu, language);
    return {
      text: menuText,
      isEnd: false,
      menuId: menu.id,
    };
  }

  private getMenuByPath(path: string[]): USSDMenu | null {
    if (path.length === 0) {
      return ussdMenus.main;
    }

    let currentMenu: USSDMenu | null = ussdMenus.main;
    
    for (const itemId of path) {
      if (!currentMenu) return null;
      
      const foundItem: USSDMenuItem | undefined = currentMenu.items.find((i) => i.id === itemId);
      if (!foundItem || !foundItem.children) return null;

      currentMenu = {
        id: foundItem.id,
        title: foundItem.label,
        items: foundItem.children,
        parentId: currentMenu.id,
      };
    }

    return currentMenu;
  }

  private formatMenu(menu: USSDMenu, language: Language): string {
    const title = menu.title[language];
    const items = menu.items
      .map((item) => `${item.option}. ${item.label[language]}`)
      .join('\n');
    
    const backOption = menu.parentId 
      ? `\n0 - ${language === 'az' ? 'Geri' : language === 'ru' ? 'Назад' : 'Back'}`
      : `\n0 - ${language === 'az' ? 'Çıxış' : language === 'ru' ? 'Выход' : 'Exit'}`;

    return `${title}\n\n${items}${backOption}`;
  }

  reset(): void {
    this.currentMenuPath = [];
    this.awaitingInput = false;
    this.inputContext = null;
  }
}

export const ussdService = new USSDService();
