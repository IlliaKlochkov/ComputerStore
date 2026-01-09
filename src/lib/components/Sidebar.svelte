<script lang="ts">
    import { Sidebar, SidebarGroup, SidebarItem, SidebarBrand, uiHelpers, SidebarDropdownWrapper, DarkMode } from "flowbite-svelte";

    import {
        DesktopPcOutline,
        LayersOutline,
        ObjectsColumnOutline,
        BuildingOutline,
        ArchiveOutline,
        FolderOutline,
        ChartPieOutline,
        ArrowRightToBracketOutline,
        UsersGroupOutline,
        FileCopyOutline
    } from "flowbite-svelte-icons";
    import { page } from "$app/state";
    import { SidebarBottomNav, SidebarBottomNavItem } from "flowbite-svelte-blocks";

    let { children } = $props();
    let activeUrl = $state(page.url.pathname);
    const demoSidebarUi = uiHelpers();
    let isDemoOpen = $state(true);
    const activeClass = "flex items-center p-2 text-base font-normal text-primary-900 bg-primary-200 dark:bg-primary-700 rounded-lg dark:text-white hover:bg-primary-100 dark:hover:bg-gray-700";
    const site = {
        name: "Store Admin",
        href: "/admin/stats",
        img: "/logo.svg"
    };
    $effect(() => {
        isDemoOpen = demoSidebarUi.isOpen;
        activeUrl = page.url.pathname;
    });
    const iconClass = "h-5 w-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white";
</script>


<div class="flex min-h-screen bg-gray-50 dark:bg-gray-900">
    <Sidebar
            {activeUrl}
            isOpen={isDemoOpen}
            class="z-50  min-h-screen overflow-y-scroll border-r"
            classes={{ active: activeClass }}
    >
        <SidebarBrand {site} classes={{ img: "h-8 w-8" }} />

        <SidebarGroup>

            <SidebarItem label="Analytics & Reports" href="/admin/stats">
                {#snippet icon()}
                    <ChartPieOutline class={iconClass} />
                {/snippet}
            </SidebarItem>

            <SidebarItem label="Users" href="/admin/users">
                {#snippet icon()}
                    <UsersGroupOutline class={iconClass} />
                {/snippet}
            </SidebarItem>

            <SidebarItem label="Operations" href="/admin/operations">
                {#snippet icon()}
                    <FileCopyOutline class={iconClass} />
                {/snippet}
            </SidebarItem>

            <SidebarDropdownWrapper label="Videocard catalog" isOpen={true}>
                {#snippet icon()}
                    <FolderOutline class={iconClass} />
                {/snippet}

                <SidebarItem label="Videocard-s" href="/admin/videocard">
                    {#snippet icon()}
                        <DesktopPcOutline class={iconClass} />
                    {/snippet}
                </SidebarItem>

                <SidebarDropdownWrapper label="GPU" isOpen={true}>
                    {#snippet icon()}
                        <FolderOutline class={iconClass} />
                    {/snippet}

                    <SidebarItem label="Gpu-s" href="/admin/gpu">
                        {#snippet icon()}
                            <LayersOutline class={iconClass} />
                        {/snippet}
                    </SidebarItem>

                    <SidebarItem label="Gpu-series" href="/admin/gpu-series">
                        {#snippet icon()}
                            <LayersOutline class={iconClass} />
                        {/snippet}
                    </SidebarItem>

                    <SidebarItem label="Gpu-family" href="/admin/gpu-family">
                        {#snippet icon()}
                            <ObjectsColumnOutline class={iconClass} />
                        {/snippet}
                    </SidebarItem>

                    <SidebarItem label="Gpu Memory-type" href="/admin/memory-type">
                        {#snippet icon()}
                            <ObjectsColumnOutline class={iconClass} />
                        {/snippet}
                    </SidebarItem>

                </SidebarDropdownWrapper>

                <SidebarDropdownWrapper label="Manufacturer" isOpen={true}>
                    {#snippet icon()}
                        <BuildingOutline class={iconClass} />
                    {/snippet}

                    <SidebarItem label="Manufacturer-series" href="/admin/manufacturer-series">
                        {#snippet icon()}
                            <ArchiveOutline class={iconClass} />
                        {/snippet}
                    </SidebarItem>

                    <SidebarItem label="Manufacturer-s" href="/admin/manufacturer">
                        {#snippet icon()}
                            <BuildingOutline class={iconClass} />
                        {/snippet}
                    </SidebarItem>
                </SidebarDropdownWrapper>
            </SidebarDropdownWrapper>


        </SidebarGroup>

        <SidebarGroup>
            <form action="/?/logout" method="POST">
                <button type="submit" class="flex items-center p-2 w-full text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                    <ArrowRightToBracketOutline class={iconClass} />
                    <span class="ml-3">Sign Out</span>
                </button>
            </form>

            <SidebarBottomNav class="flex justify-end mt-4">
                <SidebarBottomNavItem tooltip="Color Theme">
                    <DarkMode />
                </SidebarBottomNavItem>
            </SidebarBottomNav>
        </SidebarGroup>
    </Sidebar>

    <div class="overflow-auto w-full px-4 md:ml-64">
        {@render children?.()}
    </div>
</div>