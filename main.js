var charts = {}
for (table of $(".nodeinfo")) {
  let $table = $(table)

  var cont = "<p>"
  cont += "<b class='node-data'>Sync: </b><span class='sync" + uniqueClass(table.dataset.ip) + "'></span></br>"
  cont += "<b class='node-data'>Tips: </b><span class='tips" + uniqueClass(table.dataset.ip) + "'></span></br>"
  cont += "<b class='node-data'>Neighbors: </b><span class='nbs" + uniqueClass(table.dataset.ip) + "'></span></br>"
  cont += "<b class='node-data'>CPU Cores: </b><span class='cpu" + uniqueClass(table.dataset.ip) + "'></span></br>"
  cont += "<b class='node-data'>RAM Usage: </b><span class='ram" + uniqueClass(table.dataset.ip) + "'></span></br>"
  cont += "<b class='node-data'>CPU Usage: </b><span class='cputil" + uniqueClass(table.dataset.ip) + "'></span></br>"
  cont += "<b class='node-data'>Connected Wallets: </b><span class='conn" + uniqueClass(table.dataset.ip) + "'></span></br>"
  cont += '<canvas id="nodecpugraph' + uniqueClass(table.dataset.ip) + '"></canvas>'
  cont += "</p>"

  $table.html(cont)


}

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
        $(".sync" + uniqueClass(nodeip)).html('<b>' + res.latestSolidSubtangleMilestoneIndex + "</b> / " + res.latestMilestoneIndex)
        $(".tips" + uniqueClass(nodeip)).html(res.tips)
        $(".nbs" + uniqueClass(nodeip)).html(res.neighbors)
        $(".cpu" + uniqueClass(nodeip)).html(res.jreAvailableProcessors)
        $(".ram" + uniqueClass(nodeip)).html(humanFileSize(data.ramtotal * data.ramused[data.ramused.length - 1] / 100, true) + " / " + humanFileSize(data.ramtotal, true))

        if (res.latestSolidSubtangleMilestoneIndex != res.latestMilestoneIndex || res.latestSolidSubtangleMilestoneIndex == 243000) {
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

function uniqueClass(addr) {
  return addr.replace(/[\W]+/g, "_")
}
