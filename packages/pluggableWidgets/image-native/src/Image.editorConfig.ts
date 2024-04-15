import { DropZoneProps, StructurePreviewProps, topBar } from "@mendix/piw-utils-internal";
import { hidePropertiesIn, hidePropertyIn, Problem, Properties } from "@mendix/pluggable-widgets-tools";

import { DatasourceEnum, ImagePreviewProps } from "../typings/ImageProps";
import StructurePreviewImageSvg from "./assets/Image.light.svg";
import StructurePreviewImageDarkSvg from "./assets/Image.dark.svg";

type ImageViewPreviewPropsKey = keyof ImagePreviewProps;

const dataSourceProperties: ImageViewPreviewPropsKey[] = ["imageObject", "imageUrl", "imageIcon"];

function filterDataSourceProperties(sourceProperty: DatasourceEnum): ImageViewPreviewPropsKey[] {
    switch (sourceProperty) {
        case "image":
            return dataSourceProperties.filter(prop => prop !== "imageObject");
        case "imageUrl":
            return dataSourceProperties.filter(prop => prop !== "imageUrl");
        case "icon":
            return dataSourceProperties.filter(prop => prop !== "imageIcon");
        default:
            return dataSourceProperties;
    }
}

export function getProperties(values: ImagePreviewProps, defaultProperties: Properties): Properties {
    hidePropertiesIn(defaultProperties, values, filterDataSourceProperties(values.datasource));

    if (values.isBackgroundImage || values.imageIcon?.type === "glyph") {
        hidePropertiesIn(defaultProperties, values, [
            "widthUnit",
            "heightUnit",
            "customWidth",
            "customHeight",
            "onClickType",
            "onClick"
        ]);
    }
    if (!values.isBackgroundImage) {
        hidePropertiesIn(defaultProperties, values, ["children", "resizeMode", "opacity"]);
    }

    if (values.datasource === "icon") {
        hidePropertyIn(defaultProperties, values, "isBackgroundImage");
    }
    if (values.imageIcon?.type !== "glyph") {
        hidePropertyIn(defaultProperties, values, "iconSize");
    }

    if (values.datasource !== "image") {
        hidePropertyIn(defaultProperties, values, "defaultImageDynamic");
    }

    if (values.onClickType !== "action") {
        hidePropertyIn(defaultProperties, values, "onClick");
    }

    if (values.widthUnit === "auto") {
        hidePropertyIn(defaultProperties, values, "customWidth");
    }
    if (values.heightUnit === "auto") {
        hidePropertyIn(defaultProperties, values, "customHeight");
    }

    if (values.accessible === "no") {
        hidePropertyIn(defaultProperties, values, "screenReaderCaption");
        hidePropertyIn(defaultProperties, values, "screenReaderHint");
    }

    return defaultProperties;
}

export function getPreview(values: ImagePreviewProps, isDarkMode: boolean): StructurePreviewProps | null {
    if (!values.isBackgroundImage) {
        return {
            type: "Image",
            document: decodeURIComponent(
                (isDarkMode ? StructurePreviewImageDarkSvg : StructurePreviewImageSvg).replace(
                    "data:image/svg+xml,",
                    ""
                )
            ),
            height: 162,
            width: 193
        };
    }
    return topBar(
        "Image",
        {
            type: "Container",
            borders: true,
            children: [
                {
                    type: "DropZone",
                    property: values.children,
                    placeholder: "Content: Place widgets here"
                } as DropZoneProps
            ]
        },
        isDarkMode
    );
}

export function check(values: ImagePreviewProps): Problem[] {
    const errors: Problem[] = [];

    if (!values.isBackgroundImage && values.accessible === "yes" && !values.screenReaderCaption) {
        errors.push({
            property: "screenReaderCaption",
            message: "Screen reader caption cannot be empty."
        });
    }

    if (values.datasource === "image" && !values.imageObject) {
        errors.push({
            property: "imageObject",
            message: "No image selected."
        });
    }
    if (values.datasource === "imageUrl" && !values.imageUrl) {
        errors.push({
            property: "imageUrl",
            message: "No image link provided"
        });
    }
    if (values.datasource === "icon" && !values.imageIcon) {
        errors.push({
            property: "imageIcon",
            message: "No icon selected"
        });
    }

    if (values.customWidth! < 1) {
        errors.push({
            property: "customWidth",
            message: "Width can not be smaller than 1"
        });
    }
    if (values.customHeight! < 1) {
        errors.push({
            property: "customHeight",
            message: "Height can not be smaller than 1"
        });
    }

    return errors;
}
