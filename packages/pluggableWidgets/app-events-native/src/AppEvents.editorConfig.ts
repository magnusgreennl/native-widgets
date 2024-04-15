import { RowLayoutProps, StructurePreviewProps, TextProps, getColors } from "@mendix/piw-utils-internal";

import { AppEventsPreviewProps } from "../typings/AppEventsProps";

export const getPreview = (values: AppEventsPreviewProps, isDarkMode: boolean): StructurePreviewProps => ({
    type: "Container",
    borders: true,
    children: [
        {
            type: "Container",
            borders: false,
            backgroundColor: getColors(isDarkMode).background.topBar.standard,
            children: [
                {
                    type: "Container",
                    borders: false,
                    padding: 4,
                    children: renderTextActionList(values, isDarkMode)
                }
            ]
        }
    ]
});

const renderTextActionList = (values: AppEventsPreviewProps, isDarkMode: boolean): TextProps[] | RowLayoutProps[] => {
    const textBase: TextProps = {
        type: "Text",
        fontColor: getColors(isDarkMode).text.primary,
        content: ""
    };

    const textActionList: TextProps[] = [
        ...(values.onLoadAction ? [{ ...textBase, content: "On page load" }] : []),
        ...(values.onUnloadAction ? [{ ...textBase, content: "On page unload" }] : []),
        ...(values.onResumeAction ? [{ ...textBase, content: "On app resume" }] : []),
        ...(values.onResumeTimeout ? [{ ...textBase, content: "On app resume timeout" }] : []),
        ...(values.onOnlineAction ? [{ ...textBase, content: "On online" }] : []),
        ...(values.onOnlineAction && values.onOnlineTimeout ? [{ ...textBase, content: "On online timeout" }] : []),
        ...(values.onOfflineAction ? [{ ...textBase, content: "On offline" }] : []),
        ...(values.onOfflineAction && values.onOfflineTimeout ? [{ ...textBase, content: "On offline timeout" }] : []),
        ...(values.onTimeoutAction ? [{ ...textBase, content: "On timeout" }] : [])
    ] as TextProps[];

    if (textActionList.length === 0) {
        return [
            {
                type: "RowLayout",
                columnSize: "grow",
                children: [
                    {
                        type: "Container"
                    },
                    {
                        type: "Text",
                        content: "Configure events"
                    },
                    {
                        type: "Container"
                    }
                ]
            }
        ];
    }

    return textActionList;
};
