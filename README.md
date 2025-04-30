# vencord_goofy_plugins ru

Репозиторий содержит плагины для [vencord](https://vencord.dev/) которые никогда не появятся в официальном репозитории по двум причинам:
1. Манипуляции с API
2. Недостаток времени для их поддержки с моей стороны

**Плагины предоставляются в таком состоянии, корректность работы и защита аккаунтов от бана со стороны создателей оригинального продукта не гарантирована** 

**Bulk Roles: Позволяет задавать выбранную роль всем отмеченным в сообщении пользователям**

![image](https://github.com/user-attachments/assets/afd37d1a-01bb-4745-8ab5-524dde717a2a)

![image](https://github.com/user-attachments/assets/e7128875-f22e-41e4-a353-932ea4572345)


## Установка:

Чтобы установить пользовательские плагины Vencord на стандартную установку Vencord (не версию для разработки), вам нужно выполнить следующие шаги:
 * Найдите папку Vencord:
   * Откройте проводник файлов.
   * Перейдите в каталог вашего профиля пользователя. Обычно это C:\Users\<Ваше имя пользователя> в Windows или /home/<Ваше имя пользователя> в Linux и macOS.
   * Найдите папку с именем .vencord. Если вы ее не видите, убедитесь, что в настройках файлового проводника включена опция «показывать скрытые элементы».
 * Перейдите в папку src:
   * Внутри папки .vencord перейдите в папку src.
 * Создайте папку userplugins:
   * Внутри папки src создайте новую папку с именем userplugins (все строчные буквы). В ней вы будете размещать свои пользовательские плагины.
 * Добавьте свой пользовательский плагин:
   * Поместите файлы пользовательских плагинов в папку userplugins.
   * Плагин обычно должен быть либо:
     * Один файл .ts или .tsx (например, myCoolPlugin.ts).
     * Папка, содержащая файл index.ts или index.tsx (например, myCoolPlugin/index.tsx).
 * Перезапустите Discord:
   * Полностью закройте и перезапустите приложение Discord. Это позволит Vencord распознать новый плагин.
 * Включите плагин в Discord:
   * Откройте Discord и перейдите к настройкам пользователя (значок шестеренки в левом нижнем углу).
   * Прокрутите боковую панель вниз, пока не найдете раздел «Vencord».
   * Нажмите на «Плагины».
   * Теперь вы должны увидеть ваш пользовательский плагин в списке. Включите его, нажав на тумблер рядом с его названием.


# vencord_goofy_plugins en


The repository contains plugins for [vencord](https://vencord.dev/) that will never appear in the official repository for two reasons:
1. API manipulation
2. Lack of time for their support from my side

**Plugins are provided as is, correctness of work and protection of accounts from banning by the creators of the original product is not guaranteed**.

**Bulk Roles: Gives option to assign selected role to every mentioned in message user**

![image](https://github.com/user-attachments/assets/afd37d1a-01bb-4745-8ab5-524dde717a2a)

![image](https://github.com/user-attachments/assets/e7128875-f22e-41e4-a353-932ea4572345)

## installation:

To install custom Vencord plugins on a default Vencord installation (not a development version), you'll need to follow these steps:
 * Locate the Vencord Folder:
   * Open your file explorer.
   * Navigate to your user profile directory. This is usually C:\Users\<YourUsername> on Windows or /home/<YourUsername> on Linux and macOS.
   * Look for a folder named .vencord. If you can't see it, make sure you have "show hidden items" enabled in your file explorer settings.
 * Navigate to the src Folder:
   * Inside the .vencord folder, go into the src folder.
 * Create the userplugins Folder:
   * Inside the src folder, create a new folder named exactly userplugins (all lowercase). This is where you will place your custom plugins.
 * Add Your Custom Plugin:
   * Place your custom plugin files into the userplugins folder.
   * A plugin should typically be either:
     * A single .ts or .tsx file (e.g., myCoolPlugin.ts).
     * A folder containing an index.ts or index.tsx file (e.g., myCoolPlugin/index.tsx).
 * Restart Discord:
   * Completely close and restart your Discord application. This will allow Vencord to recognize the new plugin.
 * Enable the Plugin in Discord:
   * Open Discord and go to your User Settings (the gear icon in the bottom left).
   * Scroll down the sidebar until you find the "Vencord" section.
   * Click on "Plugins".
   * You should now see your custom plugin listed here. Enable it by clicking the toggle switch next to its name.
