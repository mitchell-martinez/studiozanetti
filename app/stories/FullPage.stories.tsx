import type { Meta, StoryObj } from '@storybook/react-vite'
import Footer from '~/components/Footer'
import demoSiteSettings from '~/components/Footer/__mocks__/demoSiteSettings.json'
import Navbar from '~/components/Navbar'
import demoMenu from '~/components/Navbar/__mocks__/demoMenu.json'
import BlockRenderer from '~/components/blocks/BlockRenderer'
import heroBlock from '~/components/blocks/HeroBlock/__mocks__/heroBlock.json'
import { fullPageBlocksA, fullPageBlocksB } from '~/dev/localLabData'

const meta: Meta<typeof BlockRenderer> = {
  title: 'Pages/Full Page Compositions',
  component: BlockRenderer,
}

export default meta

type Story = StoryObj<typeof meta>

const FullPage = ({ variant }: { variant: 'A' | 'B' }) => (
  <div>
    <Navbar items={demoMenu} siteName={demoSiteSettings.site_name} />
    <main id="main-content" tabIndex={-1}>
      <BlockRenderer
        blocks={variant === 'A' ? fullPageBlocksA : fullPageBlocksB}
        featuredImage={heroBlock.slides?.[0]}
      />
    </main>
    <Footer items={demoMenu} siteSettings={demoSiteSettings} />
  </div>
)

export const WeddingLandingFlow: Story = {
  render: () => <FullPage variant="A" />,
}

export const AboutAndPricingFlow: Story = {
  render: () => <FullPage variant="B" />,
}
