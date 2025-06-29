

export function get_parent_relative_element(
    element: HTMLElement,
): HTMLElement | null {
    const parent = (element.assignedSlot)
        ? element.assignedSlot?.parentElement
        : element.parentElement;
    if (parent === null) {
        return null;
    }
    const position_css = parent.computedStyleMap().get('position');
    if (position_css instanceof CSSKeywordValue && position_css.value === 'relative') {
        return parent;
    }
    return get_parent_relative_element(parent);
}