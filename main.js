var charts = {}
for (table of $(".nodeinfo")) {
  let $table = $(table)

  var cont = "<p>"
  cont += `<b class='node-data'>Sync <i class='fa fa-question-circle' data-toggle="tooltip"
    title="A node will only work properly if it is in sync. "></i>: </b><span class='sync${uniqueClass(table.dataset.ip)}'></span></br>`
  cont += `<b class='node-data'>Tips <i class='fa fa-question-circle' data-toggle="tooltip"
    title="Nodes with more tips have a higher confirmation rate. "></i>: </b><span class='tips${uniqueClass(table.dataset.ip)}'></span></br>`
  cont += `<b class='node-data'>Neighbors <i class='fa fa-question-circle' data-toggle="tooltip"
    title="Nodes with more neighbors propagate transactions faster."></i>: </b><span class='nbs${uniqueClass(table.dataset.ip)}'></span></br>`
  cont += `<b class='node-data'>CPU Cores <i class='fa fa-question-circle' data-toggle="tooltip"
    title="Nodes with more cores can handle more users simultaenously"></i>: </b><span class='cpu${uniqueClass(table.dataset.ip)}'></span></br>`
  cont += `<b class='node-data'>RAM Usage <i class='fa fa-question-circle' data-toggle="tooltip"
    title="Nodes with more avaliable RAM are faster and more stable."></i>: </b><span class='ram${uniqueClass(table.dataset.ip)}'></span></br>`
  cont += `<b class='node-data'>CPU Usage: </b><span class='cputil${uniqueClass(table.dataset.ip)}'></span></br>`
  cont += `<b class='node-data'>Health <i class='fa fa-question-circle' data-toggle="tooltip"
    title="A dynamically calculated aggregate score of a node's health"></i>: </b><span data-toggle="tooltip" class='health${uniqueClass(table.dataset.ip)}'></span></br>`
  cont += `<b class='node-data'>Connected Wallets <i class='fa fa-question-circle' data-toggle="tooltip"
    title="Picking a less used node will help your transactions confirm faster."></i>: </b><span class='conn${uniqueClass(table.dataset.ip)}'></span></br>`
  cont += '<canvas id="nodecpugraph' + uniqueClass(table.dataset.ip) + '"></canvas>'
  cont += "</p>"

  $table.html(cont)


}

const firstmilestone = 243000
function updatedata(table) {
  return function(first) {
    first = !!first

    let nodeip = table.dataset.ip

    let iota = new IOTA({
      provider: nodeip
    })



    console.log(nodeip)
    $.getJSON(nodeip.substring(0, nodeip.lastIndexOf(":")) + ":14222").done(function(data) {
      cpudata = data.cpu
      memdata = data.ramused
      iota.api.getNodeInfo(function(err, res) {
        $(".sync" + uniqueClass(nodeip)).html(
          `<b><a data-toggle="tooltip" title="Solid (Synced) Milestone">
          ${res.latestSolidSubtangleMilestoneIndex}</a></b> /
          <a data-toggle="tooltip" title="Latest Milestone">${res.latestMilestoneIndex}</a>`)
        $(".tips" + uniqueClass(nodeip)).html(res.tips)
        $(".nbs" + uniqueClass(nodeip)).html(res.neighbors)
        $(".cpu" + uniqueClass(nodeip)).html(res.jreAvailableProcessors)
        $(".ram" + uniqueClass(nodeip)).html(humanFileSize(data.ramtotal * data.ramused[data.ramused.length - 1] / 100, true) + " / " + humanFileSize(data.ramtotal, true))

        // dont update health when milestone updates to prevent health from breifly dropping to 0
        if (res.latestMilestoneIndex - res.latestSolidSubtangleMilestoneIndex != 1) {
          let health = nodehealth(res.tips, res.neighbors, cpudata[cpudata.length - 1], res.jreAvailableProcessors, data.ramtotal, data.connections,
            !(res.latestSolidSubtangleMilestoneIndex != res.latestMilestoneIndex || res.latestSolidSubtangleMilestoneIndex == firstmilestone))
          $(".health" + uniqueClass(nodeip)).html(`<b>${health.toPrecision(3)}</b>`)

          var colors = ['#CC0000', '#C82400', '#C44700', '#C06800', '#BC8800', '#B8A700', '#A3B400', '#80B000', '#5DAC00', '#3DA800', '#1DA400', '#00A000']
          var descriptions = ['Unsynced', 'Overloaded', 'Fair', 'Good', 'Great', 'Excellent']
          $(".health" + uniqueClass(nodeip)).css({
            'color': colors[Math.min(Math.floor(health), colors.length - 1)]
          })

          $(".health" + uniqueClass(nodeip)).attr('data-original-title', descriptions[Math.min(Math.floor(health / 2), descriptions.length - 1)])
        }

        // activate tooltips
        $('[data-toggle="tooltip"]').tooltip()

        if (res.latestSolidSubtangleMilestoneIndex != res.latestMilestoneIndex || res.latestSolidSubtangleMilestoneIndex == firstmilestone) {
          $(".sync" + uniqueClass(nodeip)).css({
            'color': 'darkred'
          })
        } else {
          $(".sync" + uniqueClass(nodeip)).css({
            'color': 'black'
          })
        }
      })
      $(".cputil" + uniqueClass(nodeip)).html(cpudata[cpudata.length - 1] + "%")
      $(".conn" + uniqueClass(nodeip)).html(data.connections)

      if (first) {
        let ctx = $("#nodecpugraph" + uniqueClass(nodeip))
        console.log(ctx)
        let chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: Array.apply(null, Array(cpudata.length)).map(function(_, i) {
              return i;
            }),
            datasets: [{
              label: "CPU",
              backgroundColor: "#A2000060",
              data: cpudata
            },
            {
              label: "Memory",
              backgroundColor: "#0051A560",
              data: memdata
            }]
          },
          options: {
            scales: {
              xAxes: [{
                display: false
              }],
              yAxes: [{
                display: true,
                ticks: {
                  beginAtZero: true,
                  stepSize: 20,
                  max: 100
                }
              }]
            }
          }
        })

        charts[nodeip] = chart
      } else {
        if(charts[nodeip].data.labels.length >= 20) {
          charts[nodeip].data.labels.shift()
          charts[nodeip].data.datasets[0]['data'].shift()
          charts[nodeip].data.datasets[1]['data'].shift()
          charts[nodeip].update()
        }

        if (cpudata.length < 20 || memdata.length < 20) {

        }
        charts[nodeip].data.labels.push(charts[nodeip].data
          .labels[charts[nodeip].data.labels.length - 1] + 1)
        charts[nodeip].data.datasets[0]['data'].push(cpudata[cpudata.length - 1])
        charts[nodeip].data.datasets[1]['data'].push(memdata[memdata.length - 1])
        charts[nodeip].update()
      }

    })
  }


}

for (table of $(".nodeinfo")) {
  setTimeout(updatedata(table)(true), 10)
  setInterval(updatedata(table), 5000)
}

function humanFileSize(bytes, si) {
  var thresh = si ? 1000 : 1024;
  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }
  var units = si ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  var u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return bytes.toFixed(2) + ' ' + units[u];
}

function nodehealth(tips, neighbors, cpupct, cpus, ramtotal, wallets, synced) {
  if (!synced) {
    return 0
  }

  let tiphealth = Math.log(tips + 1) * 5

  if (tips < 1000) {
    tiphealth = -10
  } else if (tips < 2000) {
    tiphealth *= 0.5
    tiphealth -= 5
  } else if (tips < 4000) {
    tiphealth *= 0.9
  }

  let neighborhealth = neighbors * 1.0

  if (neighbors > 5) {
    neighborhealth += (neighbors - 5) * 0.5
  }

  if (neighbors > 10) {
    neighborhealth += (neighbors - 10) * -0.4
  }

  let wallethealth = wallets * -0.1

  let cpuhealth = cpus * 8 * (1.1 - cpupct / 100)

  // work with gb
  ramtotal /= 1000000000
  console.log(ramtotal)
  let ramhealth = ((ramtotal < 4) ? 2.5 : 4) * Math.min(ramtotal, 30)

  console.log(tiphealth + ' ' + neighborhealth + ' ' + wallethealth + ' ' + cpuhealth + ' ' + ramhealth)
  return (tiphealth + neighborhealth + wallethealth + cpuhealth + ramhealth) * 0.1
}

function uniqueClass(addr) {
  return addr.replace(/[\W]+/g, "_")
}

$(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip()
})
