frappe.ui.toolbar.Toolbar = class extends frappe.ui.toolbar.Toolbar {
    make() {
        super.make();
        this.hide_help_menu();
    }

    hide_help_menu() {
        const help_menu = document.querySelector('.dropdown-help');
        if (help_menu) {
            help_menu.style.display = 'none';
        } else {
            // Retry if not yet rendered
            setTimeout(() => this.hide_help_menu(), 100);
        }
    }
};
